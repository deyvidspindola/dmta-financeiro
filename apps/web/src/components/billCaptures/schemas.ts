import { z } from 'zod'
import { strings } from '@/i18n/pt-BR'

export const confirmCaptureSchema = z.object({
  context_id: z.string().min(1, strings.common.required),
  description: z.string().min(1, strings.common.required),
  amount: z.coerce.number().positive(),
  due_date: z.string().min(1, strings.common.required),
  direction: z.enum(['payable', 'receivable']),
  category_id: z.string().nullable(),
  beneficiary: z.string().optional(),
})

export type ConfirmCaptureValues = z.infer<typeof confirmCaptureSchema>

export const unlockCaptureSchema = z.object({
  password: z.string().min(1, strings.common.required),
})

export type UnlockCaptureValues = z.infer<typeof unlockCaptureSchema>
