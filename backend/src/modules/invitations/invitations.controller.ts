import { Request, Response, NextFunction } from 'express'
import * as invitationsService from './invitations.service'
import { ok } from '../../lib/response'
import { param } from '../../lib/params'

export async function sendToAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const invitation = await invitationsService.sendAccountInvitation(param(req, 'id'), req.user!.id)
    ok(res, invitation, 'Invitation sent')
  } catch (err) {
    next(err)
  }
}

export async function sendToUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const invitation = await invitationsService.sendUserInvitation(param(req, 'id'), req.user!.id)
    ok(res, invitation, 'Invitation sent')
  } catch (err) {
    next(err)
  }
}

export async function validate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    ok(res, await invitationsService.validateInvitation(req.body.token as string))
  } catch (err) {
    next(err)
  }
}

export async function accept(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await invitationsService.acceptInvitation(req.body.token as string, req.body.password as string)
    ok(res, result, 'Account activated')
  } catch (err) {
    next(err)
  }
}
