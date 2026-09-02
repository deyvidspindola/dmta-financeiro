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
