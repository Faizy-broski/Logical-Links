import { z } from 'zod'

export const tokenSchema = z.object({
  token: z.string().trim().min(20, 'Invalid activation link').max(200, 'Invalid activation link'),
})

// Same password rules as registration.
export const acceptInvitationSchema = tokenSchema.extend({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

export type AcceptInvitationDto = z.infer<typeof acceptInvitationSchema>
