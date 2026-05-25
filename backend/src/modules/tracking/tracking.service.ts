import { AppError } from '../../lib/errors'
import * as trackingRepo from './tracking.repository'
import * as assignmentsRepo from '../assignments/assignments.repository'
import * as shipmentsRepo from '../shipments/shipments.repository'
import type { AddTrackingEventDto } from './tracking.schema'

type Row = Record<string, unknown>

// ── Shipment access guard ─────────────────────────────────────────────────────
// Shippers may only query tracking for their own shipments.
// Returns the shipment record so callers can use it without a second DB round-trip.
async function requireShipmentAccess(
  shipmentId: string,
  userId:     string,
  isAdmin:    boolean,
): Promise<Row> {
  const { data, error } = await shipmentsRepo.findById(shipmentId)
  if (error || !data) throw AppError.notFound('Shipment')

  const shipment = data as Row

  if (!isAdmin && shipment.created_by !== userId) {
    throw AppError.forbidden('You do not have access to this shipment')
  }

  return shipment
}

// ── Timeline ──────────────────────────────────────────────────────────────────
// Returns all events in chronological order plus the shipment summary header.
// The "latest" event is pinned separately for the current-location display.
export async function getShipmentTimeline(
  shipmentId: string,
  userId:     string,
  isAdmin:    boolean,
) {
  const shipment = await requireShipmentAccess(shipmentId, userId, isAdmin)

  const [eventsResult, latestResult] = await Promise.all([
    trackingRepo.findByShipment(shipmentId),
    trackingRepo.findLatestByShipment(shipmentId),
  ])

  if (eventsResult.error) throw AppError.internal('Failed to fetch tracking events')

  return {
    shipment: {
      shipmentId:      shipment.shipment_id,
      loadNumber:      shipment.load_number,
      status:          shipment.status,
      originCity:      shipment.origin_city,
      destinationCity: shipment.destination_city,
    },
    currentLocation: latestResult.data ?? null,
    timeline:        eventsResult.data ?? [],
    totalEvents:     (eventsResult.data ?? []).length,
  }
}

// ── Add tracking event ────────────────────────────────────────────────────────
// Automatically links the event to the current active assignment (if any).
// This means tracking events inherit the assignment context without the caller
// needing to know or pass the assignment_id.
export async function addTrackingEvent(
  shipmentId: string,
  dto:        AddTrackingEventDto,
  createdBy:  string,
) {
  // Verify the shipment exists (admin-only route, no ownership check needed)
  const { data: shipment, error: shipErr } = await shipmentsRepo.findById(shipmentId)
  if (shipErr || !shipment) throw AppError.notFound('Shipment')

  const shipmentRow = shipment as Row

  // Tracking events are only meaningful once a shipment is beyond pending/quoted
  const TRACKABLE_STATUSES = ['confirmed', 'assigned', 'in_transit', 'delivered']
  if (!TRACKABLE_STATUSES.includes(shipmentRow.status as string)) {
    throw AppError.unprocessable(
      `Cannot add tracking to a shipment with status '${shipmentRow.status as string}'. ` +
      `Shipment must be confirmed or further along.`,
    )
  }

  // Resolve the current active assignment to auto-link the event
  const { data: currentAssignment } = await assignmentsRepo.findCurrentByShipmentId(shipmentId)
  const assignmentId = currentAssignment
    ? (currentAssignment as Row).assignment_id as string
    : null

  const { data, error } = await trackingRepo.create({
    shipment_id:   shipmentId,
    assignment_id: assignmentId,
    event_type:    dto.eventType,
    location:      dto.location ?? null,
    latitude:      dto.latitude ?? null,
    longitude:     dto.longitude ?? null,
    description:   dto.description ?? null,
    recorded_at:   dto.recordedAt ?? new Date().toISOString(),
    created_by:    createdBy,
  })

  if (error || !data) throw AppError.internal('Failed to add tracking event')
  return data
}
