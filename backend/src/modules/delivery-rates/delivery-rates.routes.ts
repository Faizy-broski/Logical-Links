import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware'
import { requireAdmin, requirePermission } from '../../middleware/role.middleware'
import { validate } from '../../lib/validate'
import { createDeliveryRateSchema, updateDeliveryRateSchema, deliveryRateIdSchema } from './delivery-rates.schema'
import * as controller from './delivery-rates.controller'

export const deliveryRatesRouter = Router()

deliveryRatesRouter.use(authMiddleware, requireAdmin, requirePermission('pricing.view'))

deliveryRatesRouter.get('/', controller.list)

deliveryRatesRouter.post(
  '/',
  requirePermission('pricing.edit'),
  validate(createDeliveryRateSchema),
  controller.create,
)

deliveryRatesRouter.patch(
  '/:id',
  requirePermission('pricing.edit'),
  validate(deliveryRateIdSchema, 'params'),
  validate(updateDeliveryRateSchema),
  controller.update,
)

deliveryRatesRouter.delete(
  '/:id',
  requirePermission('pricing.edit'),
  validate(deliveryRateIdSchema, 'params'),
  controller.remove,
)
