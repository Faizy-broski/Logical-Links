import { Request, Response, NextFunction } from 'express'
import * as carriersService from './carriers.service'
import { ok, created, noContent, paginated } from '../../lib/response'
import { param } from '../../lib/params'
import type {
  CreateCarrierDto, UpdateCarrierDto, ListCarriersQuery,
  DocumentUploadUrlDto, CreateDocumentDto, UpdateDocumentDto,
} from './carriers.schema'

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as unknown as ListCarriersQuery
    const { carriers, total } = await carriersService.listCarriers(query)
    paginated(res, carriers, {
      page:       query.page  ?? 1,
      limit:      query.limit ?? 200,
      total,
      totalPages: Math.ceil(total / (query.limit ?? 200)),
    })
  } catch (err) {
    next(err)
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    ok(res, await carriersService.getCarrier(param(req, 'id')))
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

// ── Documents ─────────────────────────────────────────────────────────────────

export async function documentUploadUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    ok(res, await carriersService.getDocumentUploadUrl(param(req, 'id'), req.body as DocumentUploadUrlDto))
  } catch (err) {
    next(err)
  }
}

export async function createDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const doc = await carriersService.createDocument(param(req, 'id'), req.body as CreateDocumentDto, req.user!.id)
    created(res, doc, 'Document added')
  } catch (err) {
    next(err)
  }
}

export async function updateDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const doc = await carriersService.updateDocument(param(req, 'id'), param(req, 'docId'), req.body as UpdateDocumentDto)
    ok(res, doc, 'Document updated')
  } catch (err) {
    next(err)
  }
}

export async function deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await carriersService.deleteDocument(param(req, 'id'), param(req, 'docId'))
    noContent(res)
  } catch (err) {
    next(err)
  }
}

export async function documentUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    ok(res, await carriersService.getDocumentUrl(param(req, 'id'), param(req, 'docId')))
  } catch (err) {
    next(err)
  }
}
