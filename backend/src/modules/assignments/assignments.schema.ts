import { z } from 'zod'

export const ASSIGNMENT_STATUSES = ['pending', 'active', 'completed', 'cancelled'] as const
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number]

// ── Create (used when first assigning a carrier to a shipment) ────────────────
export const createAssignmentSchema = z.object({
  shipmentId:    z.string().uuid('Invalid shipment ID'),
  carrierId:     z.string().uuid('Invalid carrier ID'),
  driverName:    z.string().min(2),
  driverPhone:   z.string().optional(),
  vehiclePlate:  z.string().optional(),
  trailerNumber: z.string().optional(),
  pickupDate:    z.string().datetime().optional(),
  notes:         z.string().optional(),
})

// ── Reassign (carrier swap on an already-assigned shipment) ───────────────────
// Separate schema so the intent is explicit at the route level.
export const reassignCarrierSchema = z.object({
  carrierId:     z.string().uuid('Invalid carrier ID'),
  driverName:    z.string().min(2),
  driverPhone:   z.string().optional(),
  vehiclePlate:  z.string().optional(),
  trailerNumber: z.string().optional(),
  pickupDate:    z.string().datetime().optional(),
  notes:         z.string().optional(),
  reason:        z.string().min(1, 'Reassignment reason is required').max(500),
})

// ── Update (patch mutable fields on an existing assignment) ───────────────────
export const updateAssignmentSchema = createAssignmentSchema
  .omit({ shipmentId: true, carrierId: true })
  .extend({ status: z.enum(ASSIGNMENT_STATUSES).optional() })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field is required' })

// ── List assignments ───────────────────────────────────────────────────────────
export const listAssignmentsQuerySchema = z.object({
  page:       z.coerce.number().int().min(1).default(1),
  limit:      z.coerce.number().int().min(1).max(100).default(20),
  shipmentId: z.string().uuid().optional(),
  carrierId:  z.string().uuid().optional(),
  status:     z.enum(ASSIGNMENT_STATUSES).optional(),
  isCurrent:  z.enum(['true', 'false']).optional(),
})

// ── DTO types ─────────────────────────────────────────────────────────────────
export type CreateAssignmentDto  = z.infer<typeof createAssignmentSchema>
export type ReassignCarrierDto   = z.infer<typeof reassignCarrierSchema>
export type UpdateAssignmentDto  = z.infer<typeof updateAssignmentSchema>
export type ListAssignmentsQuery = z.infer<typeof listAssignmentsQuerySchema>
