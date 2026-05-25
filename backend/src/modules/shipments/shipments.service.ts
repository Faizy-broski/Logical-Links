import { AppError } from '../../lib/errors'
import * as shipmentsRepo from './shipments.repository'
import * as assignmentsRepo from '../assignments/assignments.repository'
import * as carriersRepo from '../carriers/carriers.repository'
import * as notificationsService from '../notifications/notifications.service'
import {
  STATUS_TRANSITIONS,
  DELETABLE_STATUSES,
  type ShipmentStatus,
  type CreateShipmentDto,
  type UpdateShipmentDto,
  type UpdateShipmentStatusDto,
  type DeleteShipmentDto,
  type AssignShipmentDto,
  type ListShipmentsQuery,
} from './shipments.schema'

// ── Helpers ───────────────────────────────────────────────────────────────────
function cast<T>(record: unknown): T {
  return record as T
}

// Fire-and-forget — notifications must never fail the main operation.
function notifyShipper(
  userId:    string,
  type:      'shipment_assigned' | 'shipment_in_transit' | 'shipment_delivered' | 'shipment_cancelled',
  title:     string,
  body:      string,
  entityId:  string,
): void {
  void notificationsService.createNotification({ userId, type, title, body, entityType: 'shipment', entityId })
    .catch(() => undefined)
}

type ShipmentRow = Record<string, unknown>

function assertTransition(current: ShipmentStatus, next: ShipmentStatus): void {
  if (!STATUS_TRANSITIONS[current]?.includes(next)) {
    throw AppError.unprocessable(
      `Cannot transition from '${current}' to '${next}'. ` +
      `Allowed next states: ${STATUS_TRANSITIONS[current]?.join(', ') || 'none (terminal state)'}`,
    )
  }
}

// ── Access guard ──────────────────────────────────────────────────────────────
// Returns the shipment or throws. Enforces shipper isolation.
async function requireShipmentAccess(
  id:      string,
  userId:  string,
  isAdmin: boolean,
): Promise<ShipmentRow> {
  const { data, error } = await shipmentsRepo.findById(id)
  if (error || !data) throw AppError.notFound('Shipment')

  const shipment = cast<ShipmentRow>(data)

  if (!isAdmin && shipment.created_by !== userId) {
    throw AppError.forbidden('You do not have access to this shipment')
  }

  return shipment
}

// ── List ──────────────────────────────────────────────────────────────────────
export async function listShipments(
  query:   ListShipmentsQuery,
  userId:  string,
  isAdmin: boolean,
) {
  const { data, count, error } = await shipmentsRepo.findAll(query, userId, isAdmin)
  if (error) throw AppError.internal('Failed to fetch shipments')
  return { shipments: data ?? [], total: count ?? 0 }
}

// ── Get one (with history) ────────────────────────────────────────────────────
export async function getShipment(id: string, userId: string, isAdmin: boolean) {
  const shipment = await requireShipmentAccess(id, userId, isAdmin)

  const { data: history } = await shipmentsRepo.findStatusHistory(id)

  return {
    ...shipment,
    statusHistory: history ?? [],
  }
}

// ── Create ────────────────────────────────────────────────────────────────────
export async function createShipment(dto: CreateShipmentDto, createdBy: string) {
  const { data, error } = await shipmentsRepo.create({
    shipment_type:  dto.shipmentType,
    account_id:     dto.accountId ?? null,

    origin_address:   dto.originAddress,
    origin_city:      dto.originCity,
    origin_state:     dto.originState,
    origin_postcode:  dto.originPostcode,
    origin_country:   dto.originCountry,

    destination_address:   dto.destinationAddress,
    destination_city:      dto.destinationCity,
    destination_state:     dto.destinationState,
    destination_postcode:  dto.destinationPostcode,
    destination_country:   dto.destinationCountry,

    cargo_description:       dto.cargoDescription,
    weight_kg:               dto.weightKg ?? null,
    volume_m3:               dto.volumeM3 ?? null,
    pieces:                  dto.pieces ?? null,
    is_dangerous_goods:      dto.isDangerousGoods,
    requires_refrigeration:  dto.requiresRefrigeration,

    estimated_pickup_date:    dto.estimatedPickupDate ?? null,
    estimated_delivery_date:  dto.estimatedDeliveryDate ?? null,

    quoted_price:   dto.quotedPrice ?? null,
    currency:       dto.currency,

    special_instructions: dto.specialInstructions ?? null,
    reference_number:     dto.referenceNumber ?? null,

    status:     'pending' as ShipmentStatus,
    created_by: createdBy,
  })

  if (error) throw AppError.internal('Failed to create shipment')
  return data
}

// ── Update ────────────────────────────────────────────────────────────────────
export async function updateShipment(
  id:      string,
  dto:     UpdateShipmentDto,
  userId:  string,
  isAdmin: boolean,
) {
  await requireShipmentAccess(id, userId, isAdmin)

  // Shippers cannot touch financial or actual-event fields — admin only.
  if (!isAdmin) {
    const adminOnlyFields: (keyof UpdateShipmentDto)[] = [
      'quotedPrice', 'confirmedPrice', 'currency',
      'actualPickupDate', 'actualDeliveryDate',
    ]
    for (const field of adminOnlyFields) {
      if (dto[field] !== undefined) {
        throw AppError.forbidden(`Only admins can update '${field}'`)
      }
    }
  }

  const updates: Record<string, unknown> = {}

  if (dto.originAddress   !== undefined) updates.origin_address   = dto.originAddress
  if (dto.originCity      !== undefined) updates.origin_city      = dto.originCity
  if (dto.originState     !== undefined) updates.origin_state     = dto.originState
  if (dto.originPostcode  !== undefined) updates.origin_postcode  = dto.originPostcode
  if (dto.originCountry   !== undefined) updates.origin_country   = dto.originCountry

  if (dto.destinationAddress  !== undefined) updates.destination_address   = dto.destinationAddress
  if (dto.destinationCity     !== undefined) updates.destination_city      = dto.destinationCity
  if (dto.destinationState    !== undefined) updates.destination_state     = dto.destinationState
  if (dto.destinationPostcode !== undefined) updates.destination_postcode  = dto.destinationPostcode
  if (dto.destinationCountry  !== undefined) updates.destination_country   = dto.destinationCountry

  if (dto.cargoDescription     !== undefined) updates.cargo_description      = dto.cargoDescription
  if (dto.weightKg             !== undefined) updates.weight_kg              = dto.weightKg
  if (dto.volumeM3             !== undefined) updates.volume_m3              = dto.volumeM3
  if (dto.pieces               !== undefined) updates.pieces                 = dto.pieces
  if (dto.isDangerousGoods     !== undefined) updates.is_dangerous_goods     = dto.isDangerousGoods
  if (dto.requiresRefrigeration !== undefined) updates.requires_refrigeration = dto.requiresRefrigeration

  if (dto.estimatedPickupDate   !== undefined) updates.estimated_pickup_date   = dto.estimatedPickupDate
  if (dto.estimatedDeliveryDate !== undefined) updates.estimated_delivery_date = dto.estimatedDeliveryDate
  if (dto.actualPickupDate      !== undefined) updates.actual_pickup_date      = dto.actualPickupDate
  if (dto.actualDeliveryDate    !== undefined) updates.actual_delivery_date    = dto.actualDeliveryDate

  if (dto.quotedPrice    !== undefined) updates.quoted_price    = dto.quotedPrice
  if (dto.confirmedPrice !== undefined) updates.confirmed_price = dto.confirmedPrice
  if (dto.currency       !== undefined) updates.currency        = dto.currency

  if (dto.specialInstructions !== undefined) updates.special_instructions = dto.specialInstructions
  if (dto.referenceNumber     !== undefined) updates.reference_number     = dto.referenceNumber

  const { data, error } = await shipmentsRepo.updateById(id, updates)
  if (error || !data) throw AppError.internal('Failed to update shipment')
  return data
}

// ── Status transition ─────────────────────────────────────────────────────────
// The DB trigger (trg_shipment_status_history) auto-logs the status change but
// uses created_by as changed_by. When a reason is provided we insert a second
// entry via insertStatusHistoryEntry so the audit trail captures both the actor
// and the intent. The duplication is intentional and acceptable for audit logs.
export async function updateStatus(
  id:      string,
  dto:     UpdateShipmentStatusDto,
  userId:  string,
  isAdmin: boolean,
) {
  const shipment = await requireShipmentAccess(id, userId, isAdmin)
  const currentStatus = shipment.status as ShipmentStatus

  assertTransition(currentStatus, dto.status)

  // Shippers may only self-serve the pending → confirmed path.
  // All other transitions require admin privileges.
  if (!isAdmin) {
    const shipperAllowed: ShipmentStatus[] = ['confirmed']
    if (!shipperAllowed.includes(dto.status)) {
      throw AppError.forbidden(`Shippers cannot set status to '${dto.status}'`)
    }
  }

  const updates: Record<string, unknown> = { status: dto.status }

  // Auto-stamp actual_delivery_date when marking delivered
  if (dto.status === 'delivered') {
    updates.actual_delivery_date = new Date().toISOString()
  }

  const { data, error } = await shipmentsRepo.updateById(id, updates)
  if (error || !data) throw AppError.internal('Failed to update status')

  // Write a richer history entry when a reason is supplied or the actor is not
  // the shipment creator (admin acting on behalf). The trigger entry remains
  // as a low-level audit point; this entry adds the human-readable context.
  if (dto.reason || userId !== (shipment.created_by as string)) {
    await shipmentsRepo.insertStatusHistoryEntry({
      shipmentId: id,
      oldStatus:  currentStatus,
      newStatus:  dto.status,
      changedBy:  userId,
      reason:     dto.reason,
    })
  }

  // Notify the shipper of status changes they care about.
  const shipperUserId = shipment.created_by as string
  if (dto.status === 'in_transit') {
    notifyShipper(shipperUserId, 'shipment_in_transit', 'Shipment in transit', 'Your shipment is now in transit.', id)
  } else if (dto.status === 'delivered') {
    notifyShipper(shipperUserId, 'shipment_delivered', 'Shipment delivered', 'Your shipment has been delivered.', id)
  } else if (dto.status === 'cancelled') {
    notifyShipper(shipperUserId, 'shipment_cancelled', 'Shipment cancelled', 'Your shipment has been cancelled.', id)
  }

  return data
}

// ── Assign carrier ────────────────────────────────────────────────────────────
// Admin-only. Shipment must be confirmed before a carrier can be assigned.
// The DB trigger (trg_single_current_assignment) ensures only one assignment
// has is_current=TRUE per shipment — no manual cleanup needed here.
// The DB trigger (trg_assignment_history) auto-logs the new assignment.
export async function assignCarrier(
  shipmentId: string,
  dto:        AssignShipmentDto,
  assignedBy: string,
) {
  const { data: raw, error: fetchErr } = await shipmentsRepo.findById(shipmentId)
  if (fetchErr || !raw) throw AppError.notFound('Shipment')

  const shipment     = cast<ShipmentRow>(raw)
  const currentStatus = shipment.status as ShipmentStatus

  if (currentStatus !== 'confirmed') {
    throw AppError.unprocessable(
      `Shipment must be in 'confirmed' state before assigning a carrier. ` +
      `Current status: '${currentStatus}'`,
    )
  }

  // Verify the carrier exists and is active before creating the assignment.
  const { data: carrier, error: carrierErr } = await carriersRepo.findById(dto.carrierId)
  if (carrierErr || !carrier) throw AppError.notFound('Carrier')
  if (!(carrier as Record<string, unknown>).is_active) {
    throw AppError.unprocessable('Cannot assign an inactive carrier')
  }

  // Create the assignment record — DB trigger auto-logs assignment history
  // and enforces the single-current constraint.
  const { data: assignment, error: assignErr } = await assignmentsRepo.create({
    shipment_id:    shipmentId,
    carrier_id:     dto.carrierId,
    driver_name:    dto.driverName,
    driver_phone:   dto.driverPhone ?? null,
    vehicle_plate:  dto.vehiclePlate ?? null,
    trailer_number: dto.trailerNumber ?? null,
    pickup_date:    dto.pickupDate ?? null,
    notes:          dto.notes ?? null,
    status:         'pending',
    is_current:     true,
    assigned_by:    assignedBy,
  })

  if (assignErr || !assignment) throw AppError.internal('Failed to create assignment')

  // Advance shipment: confirmed → assigned
  const { data: updatedShipment, error: updateErr } = await shipmentsRepo.updateById(
    shipmentId,
    { status: 'assigned' },
  )
  if (updateErr || !updatedShipment) throw AppError.internal('Failed to advance shipment status')

  // Notify the shipment owner that a carrier has been assigned.
  notifyShipper(
    shipment.created_by as string,
    'shipment_assigned',
    'Carrier assigned',
    'A carrier has been assigned to your shipment.',
    shipmentId,
  )

  return { shipment: updatedShipment, assignment }
}

// ── Soft delete ───────────────────────────────────────────────────────────────
// Allowed for admin only, and only for pre-commitment statuses.
// The deletion reason is captured in status_history; we do NOT cancel the
// shipment (status change would cause the DB trigger to insert a history entry
// without the reason). Instead we write one explicit history entry and set
// deleted_at without touching status, preserving the original status for
// reporting and rollback analysis.
export async function deleteShipment(
  id:      string,
  dto:     DeleteShipmentDto,
  userId:  string,
  isAdmin: boolean,
) {
  const shipment      = await requireShipmentAccess(id, userId, isAdmin)
  const currentStatus = shipment.status as ShipmentStatus

  if (!DELETABLE_STATUSES.includes(currentStatus)) {
    throw AppError.unprocessable(
      `Only shipments in ${DELETABLE_STATUSES.map((s) => `'${s}'`).join(' or ')} ` +
      `status can be deleted. Current status: '${currentStatus}'`,
    )
  }

  // Write reason to history before deleting so the record is queryable even
  // after deleted_at is set (history table is never soft-deleted).
  await shipmentsRepo.insertStatusHistoryEntry({
    shipmentId: id,
    oldStatus:  currentStatus,
    newStatus:  'cancelled',
    changedBy:  userId,
    reason:     `[DELETED] ${dto.reason}`,
  })

  const { error } = await shipmentsRepo.softDeleteById(id)
  if (error) throw AppError.internal('Failed to delete shipment')
}
