import { Request, Response, NextFunction } from 'express'
import * as service from './contact.service'
import { ok, created, paginated, parsePagination } from '../../lib/response'
import { param } from '../../lib/params'
import type {
  SubmitContactMessageDto,
  UpdateContactMessageStatusDto,
  ReplyContactMessageDto,
  ListContactMessagesQuery,
} from './contact.schema'

export async function submit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await service.submitContactMessage(req.body as SubmitContactMessageDto)
    created(res, result, 'Your message has been sent')
  } catch (err) {
    next(err)
  }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = parsePagination(req.query)
    const { messages, total } = await service.listContactMessages(req.query as unknown as ListContactMessagesQuery)
    paginated(res, messages, { page, limit, total, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    next(err)
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await service.updateContactMessageStatus(param(req, 'id'), req.body as UpdateContactMessageStatusDto)
    ok(res, result, 'Contact message status updated')
  } catch (err) {
    next(err)
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    ok(res, await service.getContactMessage(param(req, 'id')))
  } catch (err) {
    next(err)
  }
}

export async function reply(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await service.replyToContactMessage(param(req, 'id'), req.body as ReplyContactMessageDto, req.user!.id)
    created(res, result, 'Reply sent')
  } catch (err) {
    next(err)
  }
}

export async function archive(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    ok(res, await service.archiveContactMessage(param(req, 'id'), true), 'Contact message archived')
  } catch (err) {
    next(err)
  }
}

export async function unarchive(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    ok(res, await service.archiveContactMessage(param(req, 'id'), false), 'Contact message restored')
  } catch (err) {
    next(err)
  }
}
