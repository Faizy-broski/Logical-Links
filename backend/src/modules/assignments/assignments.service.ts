import { AppError } from '../../lib/errors'
import * as assignmentsRepo from './assignments.repository'
import * as shipmentsRepo from '../shipments/shipments.repository'
import type {
  CreateAssignmentDto,
  ReassignCarrierDto,
  UpdateAssignmentDto,
  ListAssignmentsQuery,
} from './assignments.schema'

type AssignmentRow = Record<string, unknown>

// ── List ──────────────────────────────────────────────────────────────────────
export async function listAssignments(query: ListAssignmentsQuery) {
  const { data, count, error } = await assignmentsRepo.findAll(query)
  if (error) throw AppError.internal('Failed to fetch assignments')
  return { assignments: data ?? [], total: count ?? 0 }
}

// ── Get one ───────────────────────────────────────────────────────────────────
export async function getAssignment(id: string) {
  const { data, error } = await assignmentsRepo.findById(id)
  if (error || !data) throw AppError.notFound('Assignment')
  return data
}

// ── Create (first-time carrier assignment) ────────────────────────────────────
// NOTE: The preferred path for carrier assignment is POST /shipments/:id/assign
// (handled by shipments.service.assignCarrier). This function is retained for
// the standalone /assignments endpoint used by admin tooling.
export async function createAssignment(dto: CreateAssignmentDto, assignedBy: string) {
  const { data: shipment, error: shipmentError } = await shipmentsRepo.findById(dto.shipmentId)
  if (shipmentError || !shipment) throw AppError.notFound('Shipment')

  const currentStatus = (shipment as AssignmentRow).status as string

  if (currentStatus !== 'confirmed') {
    throw AppError.unprocessable(
      `Shipment must be 'confirmed' before assigning a carrier. Current status: '${currentStatus}'`,
    )
  }

  const { data, error } = await assignmentsRepo.create({
    shipment_id:    dto.shipmentId,
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

  if (error || !data) throw AppError.internal('Failed to create assignment')

  // Advance shipment: confirmed → assigned
  await shipmentsRepo.updateById(dto.shipmentId, { status: 'assigned' })

  return data
}

// ── Reassign (carrier swap) ───────────────────────────────────────────────────
// Business rules:
//   1. Shipment must be assigned or in_transit (a carrier must already be active)
//   2. The current assignment is cancelled (is_current=false, status=cancelled)
//   3. A new assignment is created (is_current=true)
//   4. DB trigger (trg_single_current_assignment) auto-clears any remaining
//      is_current flags — the explicit update in step 2 is for status only.
//   5. DB trigger (trg_assignment_history) logs both status changes automatically.
export async function reassignCarrier(
  shipmentId: string,
  dto:        ReassignCarrierDto,
  assignedBy: string,
) {
  const { data: shipmentRaw, error: shipErr } = await shipmentsRepo.findById(shipmentId)
  if (shipErr || !shipmentRaw) throw AppError.notFound('Shipment')

  const shipment      = shipmentRaw as AssignmentRow
  const currentStatus = shipment.status as string

  const REASSIGNABLE_STATUSES = ['assigned', 'in_transit']
  if (!REASSIGNABLE_STATUSES.includes(currentStatus)) {
    throw AppError.unprocessable(
      `Carrier can only be reassigned on shipments in ${REASSIGNABLE_STATUSES.map((s) => `'${s}'`).join(' or ')} status. ` +
      `Current status: '${currentStatus}'`,
    )
  }

  // Find the current active assignment
  const { data: currentAssignment } = await assignmentsRepo.findCurrentByShipmentId(shipmentId)

  if (currentAssignment) {
    // Cancel the existing assignment — history trigger auto-logs this change
    await assignmentsRepo.updateById(
      (currentAssignment as AssignmentRow).assignment_id as string,
      { status: 'cancelled', is_current: false },
    )
  }

  // Create the replacement assignment — constraint trigger auto-clears other is_current flags
  const { data: newAssignment, error: createErr } = await assignmentsRepo.create({
    shipment_id:    shipmentId,
    carrier_id:     dto.carrierId,
    driver_name:    dto.driverName,
    driver_phone:   dto.driverPhone ?? null,
    vehicle_plate:  dto.vehiclePlate ?? null,
    trailer_number: dto.trailerNumber ?? null,
    pickup_date:    dto.pickupDate ?? null,
    notes:          dto.notes ? `[REASSIGNED] ${dto.reason}. ${dto.notes}` : `[REASSIGNED] ${dto.reason}`,
    status:         'active',
    is_current:     true,
    assigned_by:    assignedBy,
  })

  if (createErr || !newAssignment) throw AppError.internal('Failed to create reassignment')

  return {
    previousAssignment: currentAssignment ?? null,
    newAssignment,
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
export async function updateAssignment(id: string, dto: UpdateAssignmentDto) {
  await getAssignment(id)

  const updates: Record<string, unknown> = {}

  if (dto.driverName    !== undefined) updates.driver_name    = dto.driverName
  if (dto.driverPhone   !== undefined) updates.driver_phone   = dto.driverPhone
  if (dto.vehiclePlate  !== undefined) updates.vehicle_plate  = dto.vehiclePlate
  if (dto.trailerNumber !== undefined) updates.trailer_number = dto.trailerNumber
  if (dto.pickupDate    !== undefined) updates.pickup_date    = dto.pickupDate
  if (dto.notes         !== undefined) updates.notes          = dto.notes
  if (dto.status        !== undefined) updates.status         = dto.status

  const { data, error } = await assignmentsRepo.updateById(id, updates)
  if (error || !data) throw AppError.internal('Failed to update assignment')
  return data
}

// ── Assignment history ────────────────────────────────────────────────────────
// Returns the full audit log of all carrier assignments for a shipment.
// The DB trigger (trg_assignment_history) writes these entries automatically
// on every INSERT and status UPDATE to the assignments table.
export async function getShipmentAssignmentHistory(shipmentId: string) {
  const { data: shipmentRaw, error: shipErr } = await shipmentsRepo.findById(shipmentId)
  if (shipErr || !shipmentRaw) throw AppError.notFound('Shipment')

  const { data, error } = await assignmentsRepo.findHistoryByShipmentId(shipmentId)
  if (error) throw AppError.internal('Failed to fetch assignment history')

  return data ?? []
}
