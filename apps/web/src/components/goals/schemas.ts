import { z } from 'zod'
import { strings } from '@/i18n/pt-BR'

export const goalSchema = z.object({
  name: z.string().min(1, strings.common.required),
  target_amount: z.coerce.number().positive(),
  target_date: z.string().optional(),
  notes: z.string().optional(),
})

export type GoalFormValues = z.infer<typeof goalSchema>

export const emptyGoalValues: GoalFormValues = {
  name: '',
  target_amount: 0,
  target_date: '',
  notes: '',
}
