import { Request, Response, NextFunction } from 'express'
import * as assignmentsService from './assignments.service'
import { ok, created, paginated, parsePagination } from '../../lib/response'
import { param } from '../../lib/params'
import type {
  CreateAssignmentDto,
  ReassignCarrierDto,
  UpdateAssignmentDto,
  ListAssignmentsQuery,
} from './assignments.schema'

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = parsePagination(req.query)
    const { assignments, total } = await assignmentsService.listAssignments(
      req.query as unknown as ListAssignmentsQuery,
    )
    paginated(res, assignments, { page, limit, total, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    next(err)
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const assignment = await assignmentsService.getAssignment(param(req, 'id'))
    ok(res, assignment)
  } catch (err) {
    next(err)
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const assignment = await assignmentsService.createAssignment(
      req.body as CreateAssignmentDto,
      req.user!.id,
    )
    created(res, assignment, 'Assignment created')
  } catch (err) {
    next(err)
  }
}

// Called from POST /shipments/:id/reassign-carrier
export async function reassign(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await assignmentsService.reassignCarrier(
      param(req, 'id'),
      req.body as ReassignCarrierDto,
      req.user!.id,
    )
    created(res, result, 'Carrier reassigned')
  } catch (err) {
    next(err)
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const assignment = await assignmentsService.updateAssignment(
      param(req, 'id'),
      req.body as UpdateAssignmentDto,
    )
    ok(res, assignment, 'Assignment updated')
  } catch (err) {
    next(err)
  }
}

// Called from GET /shipments/:id/assignments/history
export async function getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const history = await assignmentsService.getShipmentAssignmentHistory(param(req, 'id'))
    ok(res, history)
  } catch (err) {
    next(err)
  }
}
