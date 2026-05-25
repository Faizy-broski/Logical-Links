import { z } from 'zod'

// ── Create ────────────────────────────────────────────────────────────────────
export const createCarrierSchema = z.object({
  carrierName:     z.string().min(2),
  carrierCode:     z.string().min(2).max(10).toUpperCase().optional(),
  abn:             z.string().optional(),

  contactName:     z.string().optional(),
  email:           z.string().email().optional(),
  phone:           z.string().optional(),

  address:         z.string().optional(),
  city:            z.string().optional(),
  state:           z.string().optional(),
  postcode:        z.string().optional(),
  country:         z.string().default('Australia'),

  mcNumber:        z.string().optional(),
  dotNumber:       z.string().optional(),
  insuranceExpiry: z.string().date().optional(),  // ISO date YYYY-MM-DD

  // Arrays stored as text[] in Postgres
  serviceTypes:   z.array(z.string()).default([]),
  coverageStates: z.array(z.string()).default([]),

  rating: z.number().min(0).max(5).optional(),
  notes:  z.string().optional(),
})

// ── Update (all optional, at least one required) ──────────────────────────────
export const updateCarrierSchema = createCarrierSchema
  .omit({ country: true })
  .extend({ country: z.string().optional(), isActive: z.boolean().optional() })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field is required' })

// ── List / search ─────────────────────────────────────────────────────────────
export const listCarriersQuerySchema = z.object({
  page:         z.coerce.number().int().min(1).default(1),
  limit:        z.coerce.number().int().min(1).max(100).default(20),
  search:       z.string().optional(),               // name, code, email
  isActive:     z.enum(['true', 'false']).optional(),
  serviceType:  z.string().optional(),               // filter by service_types[] contains value
  state:        z.string().optional(),               // filter by coverage_states[] contains value
})

// ── DTO types ─────────────────────────────────────────────────────────────────
export type CreateCarrierDto  = z.infer<typeof createCarrierSchema>
export type UpdateCarrierDto  = z.infer<typeof updateCarrierSchema>
export type ListCarriersQuery = z.infer<typeof listCarriersQuerySchema>
