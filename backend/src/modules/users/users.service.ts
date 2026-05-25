import { AppError } from '../../lib/errors'
import * as usersRepo from './users.repository'
import type { UpdateProfileDto, ListUsersQuery, UpdateUserRoleDto } from './users.schema'

export async function getProfile(id: string) {
  const { data, error } = await usersRepo.findById(id)
  if (error || !data) throw AppError.notFound('User')
  return data
}

export async function updateProfile(id: string, dto: UpdateProfileDto) {
  const { data, error } = await usersRepo.updateById(id, {
    ...(dto.fullName && { full_name: dto.fullName }),
    ...(dto.phone && { phone: dto.phone }),
    ...(dto.avatarUrl && { avatar_url: dto.avatarUrl }),
    updated_at: new Date().toISOString(),
  })
  if (error || !data) throw AppError.notFound('User')
  return data
}

export async function listUsers(query: ListUsersQuery) {
  const { data, count, error } = await usersRepo.findAll(query)
  if (error) throw AppError.internal('Failed to list users')
  return { users: data ?? [], total: count ?? 0 }
}

export async function updateUserRole(id: string, dto: UpdateUserRoleDto) {
  const { data, error } = await usersRepo.updateById(id, { role: dto.role })
  if (error || !data) throw AppError.notFound('User')
  return data
}
