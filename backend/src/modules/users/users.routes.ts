import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware'
import { requireRole } from '../../middleware/role.middleware'
import { validate } from '../../lib/validate'
import { updateProfileSchema, listUsersQuerySchema, updateUserRoleSchema } from './users.schema'
import * as usersController from './users.controller'

export const usersRouter = Router()

usersRouter.get('/me', authMiddleware, usersController.getMe)
usersRouter.patch('/me', authMiddleware, validate(updateProfileSchema), usersController.updateMe)

usersRouter.get('/', authMiddleware, requireRole('admin'), validate(listUsersQuerySchema, 'query'), usersController.listUsers)
usersRouter.patch('/:id/role', authMiddleware, requireRole('admin'), validate(updateUserRoleSchema), usersController.updateUserRole)
