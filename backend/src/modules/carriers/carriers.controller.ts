import { Request, Response, NextFunction } from 'express'
import * as carriersService from './carriers.service'
import { ok, created, noContent, paginated, parsePagination } from '../../lib/response'
import { param } from '../../lib/params'
import type { CreateCarrierDto, UpdateCarrierDto, ListCarriersQuery } from './carriers.schema'

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = parsePagination(req.query)
    const { carriers, total } = await carriersService.listCarriers(
      req.query as unknown as ListCarriersQuery,
    )
    paginated(res, carriers, { page, limit, total, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    next(err)
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const carrier = await carriersService.getCarrier(param(req, 'id'))
    ok(res, carrier)
  } catch (err) {
    next(err)
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const carrier = await carriersService.createCarrier(req.body as CreateCarrierDto, req.user!.id)
    created(res, carrier, 'Carrier created')
  } catch (err) {
    next(err)
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const carrier = await carriersService.updateCarrier(param(req, 'id'), req.body as UpdateCarrierDto)
    ok(res, carrier, 'Carrier updated')
  } catch (err) {
    next(err)
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await carriersService.deleteCarrier(param(req, 'id'))
    noContent(res)
  } catch (err) {
    next(err)
  }
}
