import { z } from 'zod'

export const visionLabelSchema = z.union([
  z.array(z.string()),
  z.object({
    labels: z.array(
      z.object({
        index: z.number().int().nonnegative(),
        code: z.string(),
        nameEn: z.string().optional(),
        nameVi: z.string().optional(),
      }),
    ),
  }),
])

export const modelOutputSchema = z.object({
  itemCode: z.string(),
})
