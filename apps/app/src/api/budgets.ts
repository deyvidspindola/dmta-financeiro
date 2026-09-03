import { http } from '@/api/http';
import type { BudgetRow } from '@/types/models';

type RawRow = {
  budget_id: string | number;
  category_id: string | number;
  category_name: string;
  is_override: boolean;
  limit: number;
  spent: number;
  spent_effective: number;
  remaining: number;
  percent: number;
  over: boolean;
};

export async function listBudgets(contextId: string, month?: string): Promise<BudgetRow[]> {
  const query = month ? `?month=${encodeURIComponent(month)}` : '';
  const payload = await http.get<{ data: RawRow[] }>(
    `/contexts/${contextId}/budgets${query}`,
  );
  return (payload.data ?? []).map(
    (row) => ({
      budget_id: String(row.budget_id),
      category_id: String(row.category_id),
      category_name: row.category_name,
      is_override: row.is_override,
      limit: Number(row.limit),
      spent: Number(row.spent),
      spent_effective: Number(row.spent_effective),
      remaining: Number(row.remaining),
      percent: Number(row.percent),
      over: row.over,
    }),
  );
}

export async function createBudget(
  contextId: string,
  input: { category_id: string; limit_amount: number; month?: string | null },
): Promise<void> {
  await http.post(`/contexts/${contextId}/budgets`, {
    category_id: Number(input.category_id),
    limit_amount: input.limit_amount,
    month: input.month ?? undefined,
  });
}

export async function updateBudget(
  contextId: string,
  budgetId: string,
  limitAmount: number,
): Promise<void> {
  await http.patch(`/contexts/${contextId}/budgets/${budgetId}`, { limit_amount: limitAmount });
}

export async function deleteBudget(contextId: string, budgetId: string): Promise<void> {
  await http.delete(`/contexts/${contextId}/budgets/${budgetId}`);
}
