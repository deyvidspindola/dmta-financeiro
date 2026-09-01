import { http, unwrapData } from '@/api/http'

export type BudgetProgress = {
  budget_id: number
  category_id: number
  category_name: string
  is_override: boolean
  limit: number
  spent: number
  remaining: number
  percent: number
  over: boolean
}

export type CreateBudgetInput = {
  category_id: string
  limit_amount: number
  month?: string | null
}

/** `month` no formato YYYY-MM. */
export async function listBudgets(
  contextId: string,
  month: string,
): Promise<BudgetProgress[]> {
  const payload = await http.get<{ data: BudgetProgress[] }>(
    `/contexts/${contextId}/budgets?month=${month}`,
  )
  return unwrapData(payload)
}

export async function createBudget(
  contextId: string,
  input: CreateBudgetInput,
): Promise<void> {
  await http.post(`/contexts/${contextId}/budgets`, {
    category_id: Number(input.category_id),
    limit_amount: input.limit_amount,
    ...(input.month ? { month: `${input.month}-01` } : {}),
  })
}

export async function updateBudget(
  contextId: string,
  budgetId: number,
  limitAmount: number,
): Promise<void> {
  await http.patch(`/contexts/${contextId}/budgets/${budgetId}`, {
    limit_amount: limitAmount,
  })
}

export async function deleteBudget(
  contextId: string,
  budgetId: number,
): Promise<void> {
  await http.delete(`/contexts/${contextId}/budgets/${budgetId}`)
}
