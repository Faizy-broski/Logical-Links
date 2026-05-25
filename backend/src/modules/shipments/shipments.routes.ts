import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware'
import { requireAdmin } from '../../middleware/role.middleware'
import { validate } from '../../lib/validate'
import {
  createShipmentSchema,
  updateShipmentSchema,
  updateShipmentStatusSchema,
  deleteShipmentSchema,
  assignShipmentSchema,
  listShipmentsQuerySchema,
} from './shipments.schema'
import { reassignCarrierSchema } from '../assignments/assignments.schema'
import { addTrackingEventSchema } from '../tracking/tracking.schema'
import * as shipmentsController from './shipments.controller'
import * as assignmentsController from '../assignments/assignments.controller'
import * as trackingController from '../tracking/tracking.controller'

export const shipmentsRouter = Router()

// ── Collection ────────────────────────────────────────────────────────────────
shipmentsRouter.get(
  '/',
  authMiddleware,
  validate(listShipmentsQuerySchema, 'query'),
  shipmentsController.list,
)

shipmentsRouter.post(
  '/',
  authMiddleware,
  validate(createShipmentSchema),
  shipmentsController.create,
)

// ── Single resource ───────────────────────────────────────────────────────────
// Sub-resource routes (/status, /assign, /tracking…) must come BEFORE /:id
// so Express doesn't greedily capture them as the :id param.
shipmentsRouter.get('/:id', authMiddleware, shipmentsController.getOne)

shipmentsRouter.patch(
  '/:id',
  authMiddleware,
  validate(updateShipmentSchema),
  shipmentsController.update,
)

shipmentsRouter.delete(
  '/:id',
  authMiddleware,
  requireAdmin,
  validate(deleteShipmentSchema),
  shipmentsController.remove,
)

// ── Status ────────────────────────────────────────────────────────────────────
// Service enforces per-role allowed transitions (admin vs shipper).
shipmentsRouter.patch(
  '/:id/status',
  authMiddleware,
  validate(updateShipmentStatusSchema),
  shipmentsController.updateStatus,
)

// ── Assignment ────────────────────────────────────────────────────────────────
// First assign — shipment must be confirmed, advances to assigned.
shipmentsRouter.post(
  '/:id/assign',
  authMiddleware,
  requireAdmin,
  validate(assignShipmentSchema),
  shipmentsController.assign,
)

// Reassign — swap carrier on an already assigned or in-transit shipment.
// Previous assignment is cancelled; new assignment is created and becomes current.
shipmentsRouter.patch(
  '/:id/reassign-carrier',
  authMiddleware,
  requireAdmin,
  validate(reassignCarrierSchema),
  assignmentsController.reassign,
)

// Assignment history — full audit log of every carrier that held this shipment.
shipmentsRouter.get(
  '/:id/assignments/history',
  authMiddleware,
  requireAdmin,
  assignmentsController.getHistory,
)

// ── Tracking ──────────────────────────────────────────────────────────────────
// GET — both roles, service enforces shipper isolation.
// POST — admin only; event is auto-linked to the current active assignment.
shipmentsRouter.get('/:id/tracking', authMiddleware, trackingController.getTimeline)

shipmentsRouter.post(
  '/:id/tracking',
  authMiddleware,
  requireAdmin,
  validate(addTrackingEventSchema),
  trackingController.addEvent,
)
