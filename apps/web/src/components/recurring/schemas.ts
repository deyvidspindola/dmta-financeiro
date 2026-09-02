import { z } from 'zod'
import { strings } from '@/i18n/pt-BR'

export const recurringSchema = z.object({
  account_id: z.string().min(1, strings.common.required),
  description: z.string().min(1, strings.common.required),
  amount: z.coerce.number().positive(),
  type: z.enum(['income', 'expense']),
  interval: z.enum(['weekly', 'monthly', 'yearly']),
  start_date: z.string().min(1, strings.common.required),
  end_date: z.string().optional(),
  category_id: z.string().nullable(),
  no_end: z.boolean(),
})

export type RecurringFormValues = z.infer<typeof recurringSchema>

export const emptyRecurringValues: RecurringFormValues = {
  account_id: '',
  description: '',
  amount: 0,
  type: 'expense',
  interval: 'monthly',
  start_date: new Date().toISOString().slice(0, 10),
  end_date: '',
  category_id: null,
  no_end: true,
}
