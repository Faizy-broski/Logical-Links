import { z } from 'zod'

// ── Status / Type enums ───────────────────────────────────────────────────────
// Must exactly match the shipment_status and shipment_type DB ENUMs.
export const SHIPMENT_STATUSES = [
  'pending',
  'quoted',
  'confirmed',
  'assigned',
  'in_transit',
  'delivered',
  'cancelled',
] as const

export const SHIPMENT_TYPES = ['freight', 'last_mile'] as const

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number]
export type ShipmentType   = (typeof SHIPMENT_TYPES)[number]

// ── Status transition machine ─────────────────────────────────────────────────
// Defines every legal "from → to" edge. Anything not listed is invalid.
// Keeping this in the schema layer makes it importable by tests without pulling
// in the full service.
export const STATUS_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  pending:    ['quoted', 'cancelled'],
  quoted:     ['confirmed', 'cancelled'],
  confirmed:  ['assigned', 'cancelled'],
  assigned:   ['in_transit', 'cancelled'],
  in_transit: ['delivered', 'cancelled'],
  delivered:  [],
  cancelled:  [],
}

// Which statuses allow soft deletion (pre-commitment only)
export const DELETABLE_STATUSES: ShipmentStatus[] = ['pending', 'quoted']

// ── Create ────────────────────────────────────────────────────────────────────
export const createShipmentSchema = z.object({
  shipmentType: z.enum(SHIPMENT_TYPES).default('freight'),
  accountId:    z.string().uuid().optional(),

  originAddress:   z.string().min(5),
  originCity:      z.string().min(1),
  originState:     z.string().min(1),
  originPostcode:  z.string().min(3),
  originCountry:   z.string().default('Australia'),

  destinationAddress:   z.string().min(5),
  destinationCity:      z.string().min(1),
  destinationState:     z.string().min(1),
  destinationPostcode:  z.string().min(3),
  destinationCountry:   z.string().default('Australia'),

  cargoDescription:      z.string().min(3),
  weightKg:              z.number().positive().optional(),
  volumeM3:              z.number().positive().optional(),
  pieces:                z.number().int().positive().optional(),
  isDangerousGoods:      z.boolean().default(false),
  requiresRefrigeration: z.boolean().default(false),

  estimatedPickupDate:    z.string().datetime().optional(),
  estimatedDeliveryDate:  z.string().datetime().optional(),

  quotedPrice:   z.number().min(0).optional(),
  currency:      z.string().length(3).default('AUD'),

  specialInstructions: z.string().optional(),
  referenceNumber:     z.string().optional(),
})

// ── Update ────────────────────────────────────────────────────────────────────
// Excludes immutable fields (type, account, status).
// Pricing fields allowed — admin may update quoted/confirmed price.
// Actual dates allowed — admin records when pickups/deliveries physically happen.
export const updateShipmentSchema = z
  .object({
    originAddress:   z.string().min(5),
    originCity:      z.string().min(1),
    originState:     z.string().min(1),
    originPostcode:  z.string().min(3),
    originCountry:   z.string(),

    destinationAddress:   z.string().min(5),
    destinationCity:      z.string().min(1),
    destinationState:     z.string().min(1),
    destinationPostcode:  z.string().min(3),
    destinationCountry:   z.string(),

    cargoDescription:      z.string().min(3),
    weightKg:              z.number().positive(),
    volumeM3:              z.number().positive(),
    pieces:                z.number().int().positive(),
    isDangerousGoods:      z.boolean(),
    requiresRefrigeration: z.boolean(),

    estimatedPickupDate:   z.string().datetime(),
    estimatedDeliveryDate: z.string().datetime(),
    actualPickupDate:      z.string().datetime(),
    actualDeliveryDate:    z.string().datetime(),

    quotedPrice:     z.number().min(0),
    confirmedPrice:  z.number().min(0),
    currency:        z.string().length(3),

    specialInstructions: z.string(),
    referenceNumber:     z.string(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field is required' })

// ── Status transition ─────────────────────────────────────────────────────────
export const updateShipmentStatusSchema = z.object({
  status: z.enum(SHIPMENT_STATUSES),
  reason: z.string().optional(),
})

// ── Soft delete (reason required) ────────────────────────────────────────────
export const deleteShipmentSchema = z.object({
  reason: z.string().min(1, 'Deletion reason is required').max(500),
})

// ── Assign carrier ────────────────────────────────────────────────────────────
// This drives the confirmed → assigned transition.
export const assignShipmentSchema = z.object({
  carrierId:     z.string().uuid('Invalid carrier ID'),
  driverName:    z.string().min(2),
  driverPhone:   z.string().optional(),
  vehiclePlate:  z.string().optional(),
  trailerNumber: z.string().optional(),
  pickupDate:    z.string().datetime().optional(),
  notes:         z.string().optional(),
})

// ── List / filter ─────────────────────────────────────────────────────────────
export const listShipmentsQuerySchema = z.object({
  page:         z.coerce.number().int().min(1).default(1),
  limit:        z.coerce.number().int().min(1).max(100).default(20),
  status:       z.enum(SHIPMENT_STATUSES).optional(),
  shipmentType: z.enum(SHIPMENT_TYPES).optional(),
  accountId:    z.string().uuid().optional(),
  carrierId:    z.string().uuid().optional(),
  search:       z.string().optional(),    // load_number, ref_number, origin/dest city
  from:         z.string().datetime().optional(),
  to:           z.string().datetime().optional(),
})

// ── DTO types ─────────────────────────────────────────────────────────────────
export type CreateShipmentDto       = z.infer<typeof createShipmentSchema>
export type UpdateShipmentDto       = z.infer<typeof updateShipmentSchema>
export type UpdateShipmentStatusDto = z.infer<typeof updateShipmentStatusSchema>
export type DeleteShipmentDto       = z.infer<typeof deleteShipmentSchema>
export type AssignShipmentDto       = z.infer<typeof assignShipmentSchema>
export type ListShipmentsQuery      = z.infer<typeof listShipmentsQuerySchema>
