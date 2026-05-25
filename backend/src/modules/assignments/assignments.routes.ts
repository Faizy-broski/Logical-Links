import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware'
import { requireAdmin } from '../../middleware/role.middleware'
import { validate } from '../../lib/validate'
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  listAssignmentsQuerySchema,
} from './assignments.schema'
import * as assignmentsController from './assignments.controller'

export const assignmentsRouter = Router()

// Admin view: list all assignments across all shipments (useful for dispatch board)
assignmentsRouter.get(
  '/',
  authMiddleware,
  requireAdmin,
  validate(listAssignmentsQuerySchema, 'query'),
  assignmentsController.list,
)

assignmentsRouter.get('/:id', authMiddleware, requireAdmin, assignmentsController.getOne)

// Standalone create — most assignment creation goes through POST /shipments/:id/assign
assignmentsRouter.post(
  '/',
  authMiddleware,
  requireAdmin,
  validate(createAssignmentSchema),
  assignmentsController.create,
)

assignmentsRouter.patch(
  '/:id',
  authMiddleware,
  requireAdmin,
  validate(updateAssignmentSchema),
  assignmentsController.update,
)
