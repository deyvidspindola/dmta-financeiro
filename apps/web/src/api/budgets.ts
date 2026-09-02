import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import { asId } from '@/api/mappers'
import { mockApi } from '@/mocks/store'

export type BudgetItemKind =
  | 'transaction'
  | 'bill'
  | 'card_purchase'
  | 'recurring_transaction'
  | 'recurring_bill'

export type BudgetItem = {
  kind: BudgetItemKind
  effective: boolean
  description: string
  category_id: string
  category_name: string | null
  amount: number
  date: string
}

export type BudgetDetail = {
  budget_id: number
  category_id: string
  category_name: string
  limit: number
  month: string
  spent: number
  spent_effective: number
  items: BudgetItem[]
}

type RawBudgetItem = Omit<BudgetItem, 'category_id' | 'amount'> & {
  category_id: string | number
  amount: string | number
}

type RawBudgetDetail = Omit<
  BudgetDetail,
  'category_id' | 'limit' | 'spent' | 'spent_effective' | 'items'
> & {
  category_id: string | number
  limit: string | number
  spent: string | number
  spent_effective: string | number
  items: RawBudgetItem[]
}

function mapBudgetItem(raw: RawBudgetItem): BudgetItem {
  return {
    kind: raw.kind,
    effective: raw.effective,
    description: raw.description,
    category_id: asId(raw.category_id),
    category_name: raw.category_name,
    amount: Number(raw.amount),
    date: raw.date,
  }
}

function mapBudgetDetail(raw: RawBudgetDetail): BudgetDetail {
  return {
    budget_id: raw.budget_id,
    category_id: asId(raw.category_id),
    category_name: raw.category_name,
    limit: Number(raw.limit),
    month: raw.month,
    spent: Number(raw.spent),
    spent_effective: Number(raw.spent_effective),
    items: raw.items.map(mapBudgetItem),
  }
}

export type BudgetProgress = {
  budget_id: number
  category_id: number
  category_name: string
  is_override: boolean
  limit: number
  spent: number
  spent_effective: number
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

/** Detalhe do consumo de um teto no mês (`month` = YYYY-MM). */
export async function getBudgetDetail(
  contextId: string,
  budgetId: number,
  month: string,
): Promise<BudgetDetail> {
  if (useMocks) return mockApi.getBudgetDetail(contextId, budgetId, month)

  const payload = await http.get<{ data: RawBudgetDetail }>(
    `/contexts/${contextId}/budgets/${budgetId}?month=${month}`,
  )
  return mapBudgetDetail(unwrapData(payload))
}
