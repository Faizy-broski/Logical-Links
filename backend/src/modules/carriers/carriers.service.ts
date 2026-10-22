import crypto from 'crypto'
import { AppError } from '../../lib/errors'
import { supabase } from '../../services/supabase.service'
import * as carriersRepo from './carriers.repository'
import type {
  CreateCarrierDto, UpdateCarrierDto, ListCarriersQuery,
  DocumentUploadUrlDto, CreateDocumentDto, UpdateDocumentDto,
} from './carriers.schema'

const BUCKET = 'carrier-documents'
const SIGNED_URL_TTL = 60 * 60 // 1 hour

// DTO (camelCase) → column (snake_case). Only keys present in the DTO are
// written, so a PATCH leaves untouched fields alone. `routes` is handled apart.
const COLUMNS: Record<Exclude<keyof UpdateCarrierDto, 'routes'>, string> = {
  carrierName:      'carrier_name',
  status:           'status',
  contactName:      'contact_name',
  contactEmail:     'contact_email',
  contactPhone:     'contact_phone',
  contactPhoneType: 'contact_phone_type',
  website:          'website',
  addressLine1:     'address_line1',
  addressCity:      'address_city',
  addressProvince:  'address_province',
  addressPostcode:  'address_postcode',
  equipmentTypes:   'equipment_types',
  equipmentOther:   'equipment_other',
  servicesOffered:  'services_offered',
  lastContactedAt:  'last_contacted_at',
  nextFollowUpAt:   'next_follow_up_at',
  notes:            'notes',
}

function toRow(dto: UpdateCarrierDto): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  for (const [key, column] of Object.entries(COLUMNS)) {
    const value = dto[key as keyof typeof COLUMNS]
    if (value !== undefined) row[column] = value
  }
  return row
}

type Embedded = { sort_order?: number; created_at?: string }

// Embedded rows come back unordered — routes by their saved order, documents oldest first.
function normalize<T extends { routes?: Embedded[] | null; documents?: Embedded[] | null }>(c: T): T {
  return {
    ...c,
    routes: [...(c.routes ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    documents: [...(c.documents ?? [])].sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? '')),
  }
}

async function replaceRoutes(carrierId: string, routes: NonNullable<UpdateCarrierDto['routes']>) {
  const { error: delErr } = await carriersRepo.deleteRoutes(carrierId)
  if (delErr) throw AppError.internal('Failed to update routes', delErr)

  // Skip rows the user left completely blank.
  const rows = routes
    .filter((r) => r.province || r.originCity || r.destinationCity)
    .map((r, i) => ({
      carrier_id:       carrierId,
      province:         r.province ?? null,
      origin_city:      r.originCity ?? null,
      destination_city: r.destinationCity ?? null,
      cross_border:     r.crossBorder,
      sort_order:       i,
    }))
  if (rows.length === 0) return

  const { error } = await carriersRepo.insertRoutes(rows)
  if (error) throw AppError.internal('Failed to save routes', error)
}

// ── Carriers ──────────────────────────────────────────────────────────────────

export async function listCarriers(query: ListCarriersQuery) {
  const { data, count, error } = await carriersRepo.findAll(query)
  if (error) throw AppError.internal('Failed to fetch carriers', error)
  return { carriers: (data ?? []).map(normalize), total: count ?? 0 }
}

export async function getCarrier(id: string) {
  const { data, error } = await carriersRepo.findById(id)
  if (error || !data) throw AppError.notFound('Carrier')
  return normalize(data)
}

export async function createCarrier(dto: CreateCarrierDto, createdBy: string) {
  const { data: dup } = await carriersRepo.findByName(dto.carrierName)
  if (dup) throw AppError.conflict(`A carrier named '${dto.carrierName}' already exists`)

  const { data, error } = await carriersRepo.create({ ...toRow(dto), created_by: createdBy })
  if (error || !data) throw AppError.internal('Failed to create carrier', error)

  const id = data.id as string
  if (dto.routes) await replaceRoutes(id, dto.routes)
  return getCarrier(id)
}

export async function updateCarrier(id: string, dto: UpdateCarrierDto) {
  await getCarrier(id)

  if (dto.carrierName !== undefined) {
    const { data: dup } = await carriersRepo.findByName(dto.carrierName, id)
    if (dup) throw AppError.conflict(`A carrier named '${dto.carrierName}' already exists`)
  }

  const row = toRow(dto)
  if (Object.keys(row).length > 0) {
    const { error } = await carriersRepo.updateById(id, row)
    if (error) throw AppError.internal('Failed to update carrier', error)
  }
  if (dto.routes) await replaceRoutes(id, dto.routes)

  return getCarrier(id)
}

export async function deleteCarrier(id: string) {
  await getCarrier(id)
  const { error } = await carriersRepo.softDeleteById(id)
  if (error) throw AppError.internal('Failed to delete carrier', error)
}

// ── Documents ─────────────────────────────────────────────────────────────────

// getDocumentUploadUrl always mints paths as `${carrierId}/...` — anything else
// would let a caller attach (and get signed URLs for) someone else's file.
function assertOwnPath(carrierId: string, filePath: string) {
  if (!filePath.startsWith(`${carrierId}/`) || filePath.includes('..')) {
    throw AppError.badRequest('Invalid file path for this carrier')
  }
}

async function removeObject(path: string) {
  // Best effort: an orphaned object is harmless, a failed request isn't.
  await supabase.storage.from(BUCKET).remove([path]).catch(() => undefined)
}

export async function getDocumentUploadUrl(carrierId: string, dto: DocumentUploadUrlDto) {
  await getCarrier(carrierId)

  const safeName = dto.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${carrierId}/${crypto.randomUUID()}-${safeName}`

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path)
  if (error || !data) throw AppError.internal('Failed to generate upload URL', error)

  return { signedUrl: data.signedUrl, token: data.token, path: data.path }
}

export async function createDocument(carrierId: string, dto: CreateDocumentDto, uploadedBy: string) {
  await getCarrier(carrierId)
  assertOwnPath(carrierId, dto.filePath)

  const { data, error } = await carriersRepo.createDocument({
    carrier_id:          carrierId,
    document_type:       dto.documentType,
    file_path:           dto.filePath,
    file_name:           dto.fileName,
    file_size:           dto.fileSize ?? null,
    mime_type:           dto.mimeType ?? null,
    issue_date:          dto.issueDate ?? null,
    expiry_date:         dto.expiryDate ?? null,
    verification_status: dto.verificationStatus ?? 'not_reviewed',
    notes:               dto.notes ?? null,
    uploaded_by:         uploadedBy,
  })
  if (error || !data) throw AppError.internal('Failed to save document', error)
  return data
}

export async function updateDocument(carrierId: string, documentId: string, dto: UpdateDocumentDto) {
  const { data: existing, error: findErr } = await carriersRepo.findDocument(carrierId, documentId)
  if (findErr || !existing) throw AppError.notFound('Document')

  const updates: Record<string, unknown> = {}
  if (dto.documentType       !== undefined) updates.document_type       = dto.documentType
  if (dto.issueDate          !== undefined) updates.issue_date          = dto.issueDate
  if (dto.expiryDate         !== undefined) updates.expiry_date         = dto.expiryDate
  if (dto.verificationStatus !== undefined) updates.verification_status = dto.verificationStatus
  if (dto.notes              !== undefined) updates.notes               = dto.notes

  const replacingFile = dto.filePath !== undefined && dto.filePath !== existing.file_path
  if (replacingFile) {
    assertOwnPath(carrierId, dto.filePath!)
    updates.file_path = dto.filePath
    updates.file_name = dto.fileName
    updates.file_size = dto.fileSize ?? null
    updates.mime_type = dto.mimeType ?? null
  }

  const { data, error } = await carriersRepo.updateDocument(documentId, updates)
  if (error || !data) throw AppError.internal('Failed to update document', error)

  if (replacingFile) await removeObject(existing.file_path as string)
  return data
}

export async function deleteDocument(carrierId: string, documentId: string) {
  const { data: existing, error: findErr } = await carriersRepo.findDocument(carrierId, documentId)
  if (findErr || !existing) throw AppError.notFound('Document')

  const { error } = await carriersRepo.deleteDocument(documentId)
  if (error) throw AppError.internal('Failed to delete document', error)
  await removeObject(existing.file_path as string)
}

export async function getDocumentUrl(carrierId: string, documentId: string) {
  const { data: existing, error: findErr } = await carriersRepo.findDocument(carrierId, documentId)
  if (findErr || !existing) throw AppError.notFound('Document')

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(existing.file_path as string, SIGNED_URL_TTL)
  if (error || !data) throw AppError.internal('Failed to open document', error)
  return { url: data.signedUrl }
}
