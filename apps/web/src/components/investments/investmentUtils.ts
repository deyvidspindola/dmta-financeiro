import { z } from 'zod'
import { strings } from '@/i18n/pt-BR'

export const investmentSchema = z.object({
  name: z.string().min(1, strings.common.required),
  type: z.string().min(1, strings.common.required),
  institution: z.string().optional(),
  invested_amount: z.coerce.number().nonnegative(),
  current_position: z.coerce.number().nonnegative(),
})

export type InvestmentFormValues = z.infer<typeof investmentSchema>

export const emptyInvestmentValues: InvestmentFormValues = {
  name: '',
  type: '',
  institution: '',
  invested_amount: 0,
  current_position: 0,
}

export function sumInvestments(
  items: Array<{ current_position: number }>,
): number {
  return items.reduce((sum, item) => sum + item.current_position, 0)
}
