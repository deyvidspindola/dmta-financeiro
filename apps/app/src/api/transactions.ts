import { http, unwrapData } from '@/api/http';
import { mapTransaction, toMoveTransactionBody } from '@/api/mappers';
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

/** Busca 1 lançamento por id — não filtra a lista inteira no cliente. */
export async function getTransaction(
  contextId: string,
  transactionId: string,
): Promise<StatementEntry> {
  const payload = await http.get<
    Parameters<typeof mapTransaction>[1] | { data: Parameters<typeof mapTransaction>[1] }
  >(`/contexts/${contextId}/transactions/${transactionId}`);
  return mapTransaction(contextId, unwrapData(payload));
}

export type CreateTransactionInput = {
  account_id: string;
  category_id: string | null;
  description: string;
  /** Campo "Observação" — texto livre além da descrição. */
  notes?: string | null;
  amount: number;
  type: 'income' | 'expense';
  occurred_at: string;
  /** `false` = lançamento previsto (não entra no saldo até ser efetivado). */
  settled: boolean;
  /** Aporte de meta — só aceito pelo backend quando `type` é `income`. */
  goal_id?: string | null;
};

export type UpdateTransactionInput = Omit<CreateTransactionInput, 'settled'>;

/**
 * Alcance de uma edição/exclusão num lançamento vindo de recorrência —
 * `this` (default) só afeta o próprio; `future` propaga da referência em
 * diante; `all` propaga pra série inteira, passado incluído. Sem efeito
 * em lançamento avulso (`recurring_transaction_id` nulo).
 */
export type RecurrenceEditScope = 'this' | 'future' | 'all';

export async function createTransaction(
  contextId: string,
  input: CreateTransactionInput,
): Promise<StatementEntry> {
  const payload = await http.post<
    Parameters<typeof mapTransaction>[1] | { data: Parameters<typeof mapTransaction>[1] }
  >(`/contexts/${contextId}/transactions`, {
    ...input,
    category_id: input.category_id ?? undefined,
    notes: input.notes || undefined,
    goal_id: input.goal_id ?? undefined,
  });
  return mapTransaction(contextId, unwrapData(payload));
}

export async function updateTransaction(
  contextId: string,
  transactionId: string,
  input: UpdateTransactionInput,
  scope: RecurrenceEditScope = 'this',
): Promise<StatementEntry> {
  const payload = await http.patch<
    Parameters<typeof mapTransaction>[1] | { data: Parameters<typeof mapTransaction>[1] }
  >(`/contexts/${contextId}/transactions/${transactionId}`, {
    ...input,
    category_id: input.category_id ?? undefined,
    notes: input.notes || undefined,
    scope,
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

export type MoveTransactionInput = {
  target_context_id: string;
  target_account_id: string;
  target_category_id: string | null;
};

/**
 * Move o lançamento pro contexto de destino — bloqueado no backend pra
 * perna de transferência, vinculado a boleto/meta/fatura de cartão
 * (`TransactionNotMovableException`).
 */
export async function moveTransaction(
  contextId: string,
  transactionId: string,
  input: MoveTransactionInput,
): Promise<StatementEntry> {
  const payload = await http.post<
    Parameters<typeof mapTransaction>[1] | { data: Parameters<typeof mapTransaction>[1] }
  >(`/contexts/${contextId}/transactions/${transactionId}/move`, toMoveTransactionBody(input));
  return mapTransaction(input.target_context_id, unwrapData(payload));
}

/** Apaga o lançamento e desfaz o efeito no saldo/boleto/meta/fatura. */
export async function deleteTransaction(
  contextId: string,
  transactionId: string,
  scope: RecurrenceEditScope = 'this',
): Promise<void> {
  const qs = scope !== 'this' ? `?scope=${scope}` : '';
  await http.delete(`/contexts/${contextId}/transactions/${transactionId}${qs}`);
}
