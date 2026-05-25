import { AppError } from '../../lib/errors'
import * as carriersRepo from './carriers.repository'
import type { CreateCarrierDto, UpdateCarrierDto, ListCarriersQuery } from './carriers.schema'

export async function listCarriers(query: ListCarriersQuery) {
  const { data, count, error } = await carriersRepo.findAll(query)
  if (error) throw AppError.internal('Failed to fetch carriers')
  return { carriers: data ?? [], total: count ?? 0 }
}

export async function getCarrier(id: string) {
  const { data, error } = await carriersRepo.findById(id)
  if (error || !data) throw AppError.notFound('Carrier')
  return data
}

export async function createCarrier(dto: CreateCarrierDto, createdBy: string) {
  const { data, error } = await carriersRepo.create({
    carrier_name:     dto.carrierName,
    carrier_code:     dto.carrierCode ?? null,
    abn:              dto.abn ?? null,
    contact_name:     dto.contactName ?? null,
    email:            dto.email ?? null,
    phone:            dto.phone ?? null,
    address:          dto.address ?? null,
    city:             dto.city ?? null,
    state:            dto.state ?? null,
    postcode:         dto.postcode ?? null,
    country:          dto.country,
    mc_number:        dto.mcNumber ?? null,
    dot_number:       dto.dotNumber ?? null,
    insurance_expiry: dto.insuranceExpiry ?? null,
    service_types:    dto.serviceTypes,
    coverage_states:  dto.coverageStates,
    rating:           dto.rating ?? null,
    notes:            dto.notes ?? null,
    is_active:        true,
    created_by:       createdBy,
  })

  if (error) {
    if ((error as { code?: string }).code === '23505') {
      throw AppError.conflict('A carrier with that code already exists')
    }
    throw AppError.internal('Failed to create carrier')
  }

  return data
}

export async function updateCarrier(id: string, dto: UpdateCarrierDto) {
  await getCarrier(id)

  const updates: Record<string, unknown> = {}

  if (dto.carrierName     !== undefined) updates.carrier_name     = dto.carrierName
  if (dto.carrierCode     !== undefined) updates.carrier_code     = dto.carrierCode
  if (dto.abn             !== undefined) updates.abn              = dto.abn
  if (dto.contactName     !== undefined) updates.contact_name     = dto.contactName
  if (dto.email           !== undefined) updates.email            = dto.email
  if (dto.phone           !== undefined) updates.phone            = dto.phone
  if (dto.address         !== undefined) updates.address          = dto.address
  if (dto.city            !== undefined) updates.city             = dto.city
  if (dto.state           !== undefined) updates.state            = dto.state
  if (dto.postcode        !== undefined) updates.postcode         = dto.postcode
  if (dto.country         !== undefined) updates.country          = dto.country
  if (dto.mcNumber        !== undefined) updates.mc_number        = dto.mcNumber
  if (dto.dotNumber       !== undefined) updates.dot_number       = dto.dotNumber
  if (dto.insuranceExpiry !== undefined) updates.insurance_expiry = dto.insuranceExpiry
  if (dto.serviceTypes    !== undefined) updates.service_types    = dto.serviceTypes
  if (dto.coverageStates  !== undefined) updates.coverage_states  = dto.coverageStates
  if (dto.rating          !== undefined) updates.rating           = dto.rating
  if (dto.notes           !== undefined) updates.notes            = dto.notes
  if (dto.isActive        !== undefined) updates.is_active        = dto.isActive

  const { data, error } = await carriersRepo.updateById(id, updates)
  if (error || !data) throw AppError.internal('Failed to update carrier')
  return data
}

// Soft delete — preserves FK references in historical assignments.
// Carriers cannot be hard-deleted because assignments.carrier_id references them.
export async function deleteCarrier(id: string) {
  await getCarrier(id)
  const { error } = await carriersRepo.softDeleteById(id)
  if (error) throw AppError.internal('Failed to deactivate carrier')
}
