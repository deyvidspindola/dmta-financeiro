import { http, unwrapData } from '@/api/http';
import { mapTransaction } from '@/api/mappers';
import type { StatementEntry } from '@/types/models';

export type TransactionListFilters = {
  from?: string;
  to?: string;
  account_id?: string;
  category_id?: string;
  type?: 'income' | 'expense' | 'transfer';
  q?: string;
};

function buildFilterQuery(filters?: TransactionListFilters): string {
  if (!filters) return '';
  const params = new URLSearchParams();
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.account_id) params.set('account_id', filters.account_id);
  if (filters.category_id) params.set('category_id', filters.category_id);
  if (filters.type) params.set('type', filters.type);
  if (filters.q?.trim()) params.set('q', filters.q.trim());
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function listTransactions(
  contextId: string,
  filters?: TransactionListFilters,
): Promise<StatementEntry[]> {
  const payload = await http.get<
    Parameters<typeof mapTransaction>[1][] | { data: Parameters<typeof mapTransaction>[1][] }
  >(`/contexts/${contextId}/transactions${buildFilterQuery(filters)}`);
  return unwrapData(payload).map((row) => mapTransaction(contextId, row));
}

export type CreateTransactionInput = {
  account_id: string;
  category_id: string | null;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  occurred_at: string;
  /** `false` = lançamento previsto (não entra no saldo até ser efetivado). */
  settled: boolean;
};

export type UpdateTransactionInput = Omit<CreateTransactionInput, 'settled'>;

export async function createTransaction(
  contextId: string,
  input: CreateTransactionInput,
): Promise<StatementEntry> {
  const payload = await http.post<
    Parameters<typeof mapTransaction>[1] | { data: Parameters<typeof mapTransaction>[1] }
  >(`/contexts/${contextId}/transactions`, {
    ...input,
    category_id: input.category_id ?? undefined,
  });
  return mapTransaction(contextId, unwrapData(payload));
}

export async function updateTransaction(
  contextId: string,
  transactionId: string,
  input: UpdateTransactionInput,
): Promise<StatementEntry> {
  const payload = await http.patch<
    Parameters<typeof mapTransaction>[1] | { data: Parameters<typeof mapTransaction>[1] }
  >(`/contexts/${contextId}/transactions/${transactionId}`, {
    ...input,
    category_id: input.category_id ?? undefined,
  });
  return mapTransaction(contextId, unwrapData(payload));
}

/** Efetiva um lançamento previsto — move o saldo agora. */
export async function settleTransaction(
  contextId: string,
  transactionId: string,
): Promise<StatementEntry> {
  const payload = await http.post<
    Parameters<typeof mapTransaction>[1] | { data: Parameters<typeof mapTransaction>[1] }
  >(`/contexts/${contextId}/transactions/${transactionId}/settle`);
  return mapTransaction(contextId, unwrapData(payload));
}
