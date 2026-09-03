import { z } from 'zod'
import { strings } from '@/i18n/pt-BR'

export const entrySchema = z.object({
  description: z.string().min(1, strings.common.required),
  amount: z.coerce.number().positive(),
  date: z.string().min(1, strings.common.required),
  type: z.enum(['income', 'expense']),
  account_id: z.string().min(1, strings.common.required),
  category_id: z.string().nullable(),
  goal_id: z.string().nullable(),
  /**
   * Payload API: `true` = efetivado, `false` = previsão.
   * No form o switch "É uma previsão?" inverte a UI (`checked = !settled`).
   */
  settled: z.boolean(),
  is_recurring: z.boolean(),
  interval: z.enum(['weekly', 'monthly', 'yearly']),
  start_date: z.string(),
  end_date: z.string(),
})

export const transferSchema = z
  .object({
    from_account_id: z.string().min(1, strings.common.required),
    to_account_id: z.string().min(1, strings.common.required),
    to_context_id: z.string().min(1, strings.common.required),
    amount: z.coerce.number().positive(),
    description: z.string().min(1, strings.common.required),
    occurred_at: z.string().min(1, strings.common.required),
  })
  .refine((v) => v.from_account_id !== v.to_account_id, {
    message: strings.transfers.sameAccount,
    path: ['to_account_id'],
  })

export const moveSchema = z.object({
  target_context_id: z.string().min(1, strings.common.required),
  target_account_id: z.string().min(1, strings.common.required),
  target_category_id: z.string().nullable(),
})

export type EntryFormValues = z.infer<typeof entrySchema>
export type TransferFormValues = z.infer<typeof transferSchema>
export type MoveFormValues = z.infer<typeof moveSchema>

export function emptyEntry(date = new Date().toISOString().slice(0, 10)): EntryFormValues {
  return {
    description: '',
    amount: 0,
    date,
    type: 'expense',
    account_id: '',
    category_id: null,
    goal_id: null,
    settled: true,
    is_recurring: false,
    interval: 'monthly',
    start_date: date,
    end_date: '',
  }
}
