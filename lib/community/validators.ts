import { z } from 'zod'

const mrtPick = z.object({
  transport_type: z.literal('mrt'),
  station_id: z.number().int().positive().optional(),
  filter: z
    .object({
      line_codes: z.array(z.string().min(1)).optional(),
    })
    .optional()
    .default({}),
})

const traPick = z.object({
  transport_type: z.literal('tra'),
  filter: z.object({
    counties: z.array(z.string().min(1)).min(1),
  }),
})

export const pickRequestSchema = z.discriminatedUnion('transport_type', [
  mrtPick,
  traPick,
])

export type PickRequest = z.infer<typeof pickRequestSchema>

export const commentRequestSchema = z.object({
  content: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(10).max(500)),
  honeypot: z.string().max(0, 'honeypot must be empty').optional().default(''),
})

export type CommentRequest = z.infer<typeof commentRequestSchema>
