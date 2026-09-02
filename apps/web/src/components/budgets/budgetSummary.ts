import type { BudgetProgress } from '@/api/budgets'

export type BudgetSummary = {
  spent: number
  limit: number
  overCount: number
  pct: number
}

export function summarizeBudgets(rows: BudgetProgress[]): BudgetSummary | null {
  if (rows.length === 0) return null
  const spent = rows.reduce((sum, row) => sum + row.spent, 0)
  const limit = rows.reduce((sum, row) => sum + row.limit, 0)
  const overCount = rows.filter((row) => row.over).length
  const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0
  return { spent, limit, overCount, pct }
}
