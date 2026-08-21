import { z } from 'zod'

export const calculatePriceSchema = z.object({
  serviceType:          z.string().min(1),
  distanceKm:           z.coerce.number().min(0),
  additionalChargeKeys: z.array(z.string()).default([]),
})

export type CalculatePriceDto = z.infer<typeof calculatePriceSchema>
