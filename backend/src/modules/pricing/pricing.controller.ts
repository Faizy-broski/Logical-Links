import { Request, Response, NextFunction } from 'express'
import * as pricingService from './pricing.service'
import { ok } from '../../lib/response'
import type { CalculatePriceDto } from './pricing.schema'

export async function calculate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const breakdown = await pricingService.calculateDeliveryPrice(req.body as CalculatePriceDto)
    ok(res, breakdown)
  } catch (err) {
    next(err)
  }
}
