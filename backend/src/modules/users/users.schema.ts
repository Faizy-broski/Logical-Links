import { z } from 'zod'

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
  // Only honoured for a phone-only customer with no email yet (see updateProfile).
  email: z.string().trim().email('Enter a valid email').max(320).optional(),
  avatarUrl: z.string().url().optional(),
  // YYYY-MM-DD — used only for the residential Rewards birthday bonus.
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date').optional(),
})

// Admin adds a residential customer who books by phone — email is optional.
export const createResidentialCustomerSchema = z.object({
  fullName: z.string().trim().min(2, 'Name is required').max(100),
  phone:    z.string().trim().min(7, 'Phone number is required').max(30),
  email:    z.string().trim().email('Enter a valid email').max(320).optional().or(z.literal('')),
})

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(['admin', 'corporate', 'residential']).optional(),
  search: z.string().optional(),
})

export const updateUserRoleSchema = z.object({
  role: z.enum(['admin', 'corporate']),
})

export const approveUserSchema = z.object({
  isApproved: z.boolean(),
})

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>
export type CreateResidentialCustomerDto = z.infer<typeof createResidentialCustomerSchema>
export type ListUsersQuery   = z.infer<typeof listUsersQuerySchema>
export type UpdateUserRoleDto = z.infer<typeof updateUserRoleSchema>
export type ApproveUserDto   = z.infer<typeof approveUserSchema>
