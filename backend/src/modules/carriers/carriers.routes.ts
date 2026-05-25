import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware'
import { requireAdmin } from '../../middleware/role.middleware'
import { validate } from '../../lib/validate'
import { createCarrierSchema, updateCarrierSchema, listCarriersQuerySchema } from './carriers.schema'
import * as carriersController from './carriers.controller'

export const carriersRouter = Router()

// Both roles can browse the carrier directory
carriersRouter.get(
  '/',
  authMiddleware,
  validate(listCarriersQuerySchema, 'query'),
  carriersController.list,
)

carriersRouter.get('/:id', authMiddleware, carriersController.getOne)

// Admin-only mutations
carriersRouter.post(
  '/',
  authMiddleware,
  requireAdmin,
  validate(createCarrierSchema),
  carriersController.create,
)

carriersRouter.patch(
  '/:id',
  authMiddleware,
  requireAdmin,
  validate(updateCarrierSchema),
  carriersController.update,
)

// Soft-delete — preserves FK references in assignments history
carriersRouter.delete('/:id', authMiddleware, requireAdmin, carriersController.remove)
