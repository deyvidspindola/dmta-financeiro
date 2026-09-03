import { http, unwrapData } from '@/api/http';
import { mapDebt, toCreateDebtBody, toUpdateDebtBody } from '@/api/mappers';
import type { Debt, DebtDirection } from '@/types/models';

export type DebtInput = {
  description: string;
  amount: number;
  direction: DebtDirection;
  counterparty: string | null;
  due_date: string | null;
  notes: string | null;
};

export async function listDebts(contextId: string): Promise<Debt[]> {
  const payload = await http.get<
    Parameters<typeof mapDebt>[0][] | { data: Parameters<typeof mapDebt>[0][] }
  >(`/contexts/${contextId}/debts`);
  return unwrapData(payload).map(mapDebt);
}

export async function createDebt(contextId: string, input: DebtInput): Promise<Debt> {
  const payload = await http.post<
    Parameters<typeof mapDebt>[0] | { data: Parameters<typeof mapDebt>[0] }
  >(`/contexts/${contextId}/debts`, toCreateDebtBody(input));
  return mapDebt(unwrapData(payload));
}

export async function updateDebt(
  contextId: string,
  debtId: string,
  input: Omit<DebtInput, 'direction'>,
): Promise<Debt> {
  const payload = await http.patch<
    Parameters<typeof mapDebt>[0] | { data: Parameters<typeof mapDebt>[0] }
  >(`/contexts/${contextId}/debts/${debtId}`, toUpdateDebtBody(input));
  return mapDebt(unwrapData(payload));
}

/** Marca a dívida como quitada (sem lançar na conta). */
export async function settleDebt(contextId: string, debtId: string): Promise<void> {
  await http.post(`/contexts/${contextId}/debts/${debtId}/settle`);
}

export async function deleteDebt(contextId: string, debtId: string): Promise<void> {
  await http.delete(`/contexts/${contextId}/debts/${debtId}`);
}
