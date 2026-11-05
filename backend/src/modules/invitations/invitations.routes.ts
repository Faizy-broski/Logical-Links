import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware'
import { requireAdmin, requirePermission } from '../../middleware/role.middleware'
import { authLimiter } from '../../middleware/rate-limit.middleware'
import { validate } from '../../lib/validate'
import { tokenSchema, acceptInvitationSchema } from './invitations.schema'
import * as invitationsController from './invitations.controller'

export const invitationsRouter = Router()

// ── Public (the customer, from the email link) ───────────────────────────────
// Rate-limited like login: the token is the only credential here.
invitationsRouter.post('/validate', authLimiter, validate(tokenSchema), invitationsController.validate)
invitationsRouter.post('/accept', authLimiter, validate(acceptInvitationSchema), invitationsController.accept)

// ── Admin: send / resend credentials ─────────────────────────────────────────
invitationsRouter.post(
  '/accounts/:id/send',
  authMiddleware,
  requireAdmin,
  requirePermission('customers.edit'),
  invitationsController.sendToAccount,
)

invitationsRouter.post(
  '/users/:id/send',
  authMiddleware,
  requireAdmin,
  requirePermission('customers.edit'),
  invitationsController.sendToUser,
)
