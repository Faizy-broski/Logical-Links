import { z } from 'zod'

// Same stages as the corporate customer pipeline.
export const CARRIER_STATUSES = [
  'prospect', 'contacted', 'interested', 'onboarding', 'active', 'inactive', 'lost',
] as const
export type CarrierStatus = (typeof CARRIER_STATUSES)[number]

export const DOCUMENT_VERIFICATION_STATUSES = [
  'not_reviewed', 'pending', 'verified', 'expired', 'rejected',
] as const

// Optional text field: trims, and an empty string clears the value (→ null).
const text = (max: number) =>
  z.string().max(max).transform((s) => (s.trim() === '' ? null : s.trim())).nullable().optional()

// YYYY-MM-DD from a date input; '' or null clears it.
const date = z
  .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal('')])
  .transform((s) => s || null)
  .nullable()
  .optional()

const routeSchema = z.object({
  province:        text(100),
  originCity:      text(100),
  destinationCity: text(100),
  crossBorder:     z.boolean().default(false),
})

export const createCarrierSchema = z.object({
  carrierName:      z.string().trim().min(2).max(200),
  status:           z.enum(CARRIER_STATUSES).optional(),
  contactName:      text(200),
  contactEmail:     z.union([z.string().trim().email(), z.literal('')]).transform((s) => s || null).nullable().optional(),
  contactPhone:     text(50),
  contactPhoneType: text(50),
  website:          text(300),
  addressLine1:     text(300),
  addressCity:      text(100),
  addressProvince:  text(100),
  addressPostcode:  text(20),
  equipmentTypes:   z.array(z.string().trim().min(1).max(100)).max(40).optional(),
  equipmentOther:   text(300),
  servicesOffered:  z.array(z.string().trim().min(1).max(100)).max(30).optional(),
  lastContactedAt:  date,
  nextFollowUpAt:   date,
  notes:            text(5000),
  // Replaces the carrier's full route list when present.
  routes:           z.array(routeSchema).max(100).optional(),
})

export const updateCarrierSchema = createCarrierSchema.partial()

export const listCarriersSchema = z.object({
  page:   z.coerce.number().int().positive().default(1),
  limit:  z.coerce.number().int().positive().max(500).default(200),
  search: z.string().max(100).optional(),
  status: z.enum(CARRIER_STATUSES).optional(),
})

// ── Documents ─────────────────────────────────────────────────────────────────
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024

export const documentUploadUrlSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().min(1).max(MAX_DOCUMENT_BYTES).optional(),
})

const documentFields = {
  documentType:       z.string().trim().min(1).max(100),
  issueDate:          date,
  expiryDate:         date,
  verificationStatus: z.enum(DOCUMENT_VERIFICATION_STATUSES).optional(),
  notes:              text(2000),
}

const fileFields = {
  filePath: z.string().min(1).max(500),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().min(0).max(MAX_DOCUMENT_BYTES).optional(),
  mimeType: z.string().max(150).optional(),
}

export const createDocumentSchema = z.object({ ...documentFields, ...fileFields })

// Metadata edits; pass the file fields too to replace the uploaded file.
export const updateDocumentSchema = z
  .object({ ...documentFields, ...fileFields })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field is required' })
  .refine((v) => (v.filePath === undefined) === (v.fileName === undefined), {
    message: 'filePath and fileName must be sent together',
  })

export type CreateCarrierDto       = z.infer<typeof createCarrierSchema>
export type UpdateCarrierDto       = z.infer<typeof updateCarrierSchema>
export type ListCarriersQuery      = z.infer<typeof listCarriersSchema>
export type DocumentUploadUrlDto   = z.infer<typeof documentUploadUrlSchema>
export type CreateDocumentDto      = z.infer<typeof createDocumentSchema>
export type UpdateDocumentDto      = z.infer<typeof updateDocumentSchema>
