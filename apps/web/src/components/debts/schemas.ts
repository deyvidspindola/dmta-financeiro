import { z } from 'zod'
import { strings } from '@/i18n/pt-BR'
import type { Debt, DebtDirection } from '@/types/models'

export const debtSchema = z.object({
  description: z.string().min(1, strings.common.required),
  amount: z.coerce.number().positive(),
  direction: z.enum(['i_owe', 'owed_to_me']),
  counterparty: z.string().optional(),
  due_date: z.string().optional(),
  notes: z.string().optional(),
})

export type DebtFormValues = z.infer<typeof debtSchema>

export const emptyDebtValues: DebtFormValues = {
  description: '',
  amount: 0,
  direction: 'i_owe',
  counterparty: '',
  due_date: '',
  notes: '',
}

export type DebtSummary = {
  oweTotal: number
  owedTotal: number
}

export function summarizeDebts(rows: Debt[]): DebtSummary {
  return rows.reduce(
    (acc, row) => {
      if (row.status !== 'pending') return acc
      if (row.direction === 'i_owe') acc.oweTotal += row.amount
      else acc.owedTotal += row.amount
      return acc
    },
    { oweTotal: 0, owedTotal: 0 },
  )
}

export type SettleDebtValues = {
  account_id: string
}

export const settleDebtSchema = z.object({
  account_id: z.string().optional(),
})

export function directionTone(
  direction: DebtDirection,
): 'danger' | 'success' {
  return direction === 'i_owe' ? 'danger' : 'success'
}
