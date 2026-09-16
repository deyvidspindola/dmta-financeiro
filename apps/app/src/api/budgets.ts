import { http } from '@/api/http';
import type { BudgetRow, BudgetDetail, BudgetItem } from '@/types/models';

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

type RawBudgetItem = {
  kind: 'transaction' | 'bill' | 'card_purchase' | 'recurring_transaction' | 'recurring_bill';
  effective: boolean;
  description: string;
  category_id: string | number;
  category_name: string | null;
  amount: string | number;
  date: string;
};

type RawBudgetDetail = {
  budget_id: number;
  category_id: string | number;
  category_name: string;
  limit: string | number;
  month: string;
  spent: string | number;
  spent_effective: string | number;
  items: RawBudgetItem[];
};

export async function listBudgets(contextId: string, month?: string): Promise<BudgetRow[]> {
  const query = month ? `?month=${encodeURIComponent(month)}` : '';
  const payload = await http.get<{ data: RawRow[] }>(`/contexts/${contextId}/budgets${query}`);
  return (payload.data ?? []).map((row) => ({
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
  }));
}

export async function getBudgetDetail(
  contextId: string,
  budgetId: string,
  month: string,
): Promise<BudgetDetail> {
  const payload = await http.get<{ data: RawBudgetDetail }>(
    `/contexts/${contextId}/budgets/${budgetId}?month=${month}`,
  );
  const raw = payload.data;
  return {
    budget_id: String(raw.budget_id),
    category_id: String(raw.category_id),
    category_name: raw.category_name,
    limit: Number(raw.limit),
    month: raw.month,
    spent: Number(raw.spent),
    spent_effective: Number(raw.spent_effective),
    items: raw.items.map((item): BudgetItem => ({
      kind: item.kind,
      effective: item.effective,
      description: item.description,
      category_id: String(item.category_id),
      category_name: item.category_name,
      amount: Number(item.amount),
      date: item.date,
    })),
  };
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
