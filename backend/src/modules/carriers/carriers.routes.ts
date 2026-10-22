import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware'
import { requireAdmin, requirePermission } from '../../middleware/role.middleware'
import { validate } from '../../lib/validate'
import {
  createCarrierSchema, updateCarrierSchema, listCarriersSchema,
  documentUploadUrlSchema, createDocumentSchema, updateDocumentSchema,
} from './carriers.schema'
import * as carriersController from './carriers.controller'

// Carriers are independent trucking companies — admin staff only, gated by the
// "Carrier Management" permissions (migration 087). Documents are part of the
// carrier profile: viewing needs carriers.view, changing them carriers.edit.
export const carriersRouter = Router()

carriersRouter.use(authMiddleware, requireAdmin)

carriersRouter.get('/', requirePermission('carriers.view'), validate(listCarriersSchema, 'query'), carriersController.list)
carriersRouter.get('/:id', requirePermission('carriers.view'), carriersController.getOne)
carriersRouter.post('/', requirePermission('carriers.create'), validate(createCarrierSchema), carriersController.create)
carriersRouter.patch('/:id', requirePermission('carriers.edit'), validate(updateCarrierSchema), carriersController.update)
carriersRouter.delete('/:id', requirePermission('carriers.delete'), carriersController.remove)

carriersRouter.post(
  '/:id/documents/upload-url',
  requirePermission('carriers.edit'),
  validate(documentUploadUrlSchema),
  carriersController.documentUploadUrl,
)
carriersRouter.post('/:id/documents', requirePermission('carriers.edit'), validate(createDocumentSchema), carriersController.createDocument)
carriersRouter.patch('/:id/documents/:docId', requirePermission('carriers.edit'), validate(updateDocumentSchema), carriersController.updateDocument)
carriersRouter.delete('/:id/documents/:docId', requirePermission('carriers.edit'), carriersController.deleteDocument)
carriersRouter.get('/:id/documents/:docId/url', requirePermission('carriers.view'), carriersController.documentUrl)
