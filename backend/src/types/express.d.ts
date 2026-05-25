import { UserRole } from '../middleware/auth.middleware'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: UserRole
      }
      requestId: string
      startTime: number
    }
  }
}

export {}
