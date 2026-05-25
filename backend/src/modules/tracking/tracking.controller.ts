import { Request, Response, NextFunction } from 'express'
import * as trackingService from './tracking.service'
import { ok, created } from '../../lib/response'
import { param } from '../../lib/params'
import type { AddTrackingEventDto } from './tracking.schema'

// Mounted at GET /shipments/:id/tracking
export async function getTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await trackingService.getShipmentTimeline(
      param(req, 'id'),
      req.user!.id,
      req.user!.role === 'admin',
    )
    ok(res, result)
  } catch (err) {
    next(err)
  }
}

// Mounted at POST /shipments/:id/tracking
export async function addEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const event = await trackingService.addTrackingEvent(
      param(req, 'id'),
      req.body as AddTrackingEventDto,
      req.user!.id,
    )
    created(res, event, 'Tracking event added')
  } catch (err) {
    next(err)
  }
}
