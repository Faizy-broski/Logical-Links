import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware'
import { requireAdmin, requirePermission } from '../../middleware/role.middleware'
import { validate } from '../../lib/validate'
import { calculatePriceSchema } from './pricing.schema'
import * as pricingController from './pricing.controller'

export const pricingRouter = Router()

// Corporate/admin-driven pricing calculation — a pure calculation, does not
// itself create a quotation (that's a separate explicit "Generate Quote" action).
pricingRouter.post(
  '/calculate',
  authMiddleware,
  requireAdmin,
  requirePermission('deliveries.create'),
  validate(calculatePriceSchema),
  pricingController.calculate,
)
