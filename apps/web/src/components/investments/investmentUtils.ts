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

export function sumInvested(items: Array<{ invested_amount: number }>): number {
  return items.reduce((sum, item) => sum + item.invested_amount, 0)
}

export type GainLoss = { amount: number; percent: number | null }

/**
 * Ganho/perda = posição atual − valor investido, com os dois números que o
 * usuário já cadastra manualmente (D-14: nada de cotação de mercado
 * automática, isso aqui é só a conta local). `percent` fica `null` quando
 * não dá pra calcular variação percentual (nada investido ainda).
 */
export function computeGainLoss(item: {
  invested_amount: number
  current_position: number
}): GainLoss {
  const amount = item.current_position - item.invested_amount
  const percent = item.invested_amount > 0 ? (amount / item.invested_amount) * 100 : null
  return { amount, percent }
}
