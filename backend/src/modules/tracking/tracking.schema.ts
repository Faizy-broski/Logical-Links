import { z } from 'zod'

export const TRACKING_EVENT_TYPES = [
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'failed_attempt',
  'exception',
  'customs_hold',
  'returned',
] as const

export type TrackingEventType = (typeof TRACKING_EVENT_TYPES)[number]

// ── Add event ─────────────────────────────────────────────────────────────────
// shipmentId is intentionally absent — it comes from the URL param :id,
// not the request body. The service receives it as a separate argument.
export const addTrackingEventSchema = z.object({
  eventType:   z.enum(TRACKING_EVENT_TYPES),
  location:    z.string().optional(),
  latitude:    z.number().min(-90).max(90).optional(),
  longitude:   z.number().min(-180).max(180).optional(),
  description: z.string().max(1000).optional(),
  recordedAt:  z.string().datetime().optional(),
})

// ── DTO types ─────────────────────────────────────────────────────────────────
export type AddTrackingEventDto = z.infer<typeof addTrackingEventSchema>
