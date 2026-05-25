// Tracking events are served as a sub-resource of shipments:
//   GET  /api/v1/shipments/:id/tracking
//   POST /api/v1/shipments/:id/tracking
//
// These routes are registered in shipments.routes.ts so the :id param is
// consistent with the rest of the shipments sub-resource API. This file is
// intentionally empty — the router export is kept to avoid breaking the v1.ts
// import until that import is cleaned up.

import { Router } from 'express'
export const trackingRouter = Router()
