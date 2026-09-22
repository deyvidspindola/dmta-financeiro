import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import {
  mapTransaction,
  toCreateTransactionBody,
  toMoveTransactionBody,
  toUpdateTransactionBody,
} from '@/api/mappers'
import { mockApi } from '@/mocks/store'
import type { MoneyDirection, StatementEntry } from '@/types/models'

export type CreateTransactionInput = {
  account_id: string
  category_id: string | null
  description: string
  amount: number
  type: MoneyDirection
  date: string
  goal_id?: string | null
  /** `false` = nasce previsto (não move saldo). Default no backend: `true`. */
  settled?: boolean
}

export type UpdateTransactionInput = Omit<CreateTransactionInput, 'settled' | 'goal_id'> & {
  goal_id?: string | null
}

/**
 * Alcance de uma edição/exclusão num lançamento vindo de recorrência —
 * `this` (default) só afeta o próprio; `future` propaga da referência em
 * diante; `all` propaga pra série inteira, passado incluído. Sem efeito
 * em lançamento avulso (`recurring_transaction_id` nulo).
 */
export type RecurrenceEditScope = 'this' | 'future' | 'all'

export type MoveTransactionInput = {
  target_context_id: string
  target_account_id: string
  target_category_id: string | null
}

export type TransactionListFilters = {
  from?: string
  to?: string
  account_id?: string
  category_id?: string
  type?: 'income' | 'expense' | 'transfer'
  q?: string
}

function buildFilterQuery(filters?: TransactionListFilters): string {
  if (!filters) return ''
  const params = new URLSearchParams()
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  if (filters.account_id) params.set('account_id', filters.account_id)
  if (filters.category_id) params.set('category_id', filters.category_id)
  if (filters.type) params.set('type', filters.type)
  if (filters.q?.trim()) params.set('q', filters.q.trim())
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export async function listTransactions(
  contextId: string,
  filters?: TransactionListFilters,
): Promise<StatementEntry[]> {
  if (useMocks) return mockApi.listTransactions(contextId, filters)
  const payload = await http.get<
    | Array<Parameters<typeof mapTransaction>[1]>
    | { data: Array<Parameters<typeof mapTransaction>[1]> }
  >(`/contexts/${contextId}/transactions${buildFilterQuery(filters)}`)
  return unwrapData(payload).map((row) => mapTransaction(contextId, row))
}

export async function getTransaction(
  contextId: string,
  transactionId: string,
): Promise<StatementEntry> {
  if (useMocks) return mockApi.getTransaction(contextId, transactionId)
  const payload = await http.get<
    | Parameters<typeof mapTransaction>[1]
    | { data: Parameters<typeof mapTransaction>[1] }
  >(`/contexts/${contextId}/transactions/${transactionId}`)
  return mapTransaction(contextId, unwrapData(payload))
}

export async function createTransaction(
  contextId: string,
  payload: CreateTransactionInput,
): Promise<StatementEntry> {
  if (useMocks) return mockApi.createTransaction(contextId, payload)
  const created = unwrapData(
    await http.post<
      | Parameters<typeof mapTransaction>[1]
      | { data: Parameters<typeof mapTransaction>[1] }
    >(
      `/contexts/${contextId}/transactions`,
      toCreateTransactionBody(payload),
    ),
  )
  return mapTransaction(contextId, created)
}

export async function updateTransaction(
  contextId: string,
  transactionId: string,
  payload: UpdateTransactionInput,
  scope: RecurrenceEditScope = 'this',
): Promise<StatementEntry> {
  if (useMocks) {
    return mockApi.updateTransaction(contextId, transactionId, payload)
  }
  const updated = unwrapData(
    await http.patch<
      | Parameters<typeof mapTransaction>[1]
      | { data: Parameters<typeof mapTransaction>[1] }
    >(
      `/contexts/${contextId}/transactions/${transactionId}`,
      { ...toUpdateTransactionBody(payload), scope },
    ),
  )
  return mapTransaction(contextId, updated)
}

export async function moveTransaction(
  contextId: string,
  transactionId: string,
  payload: MoveTransactionInput,
): Promise<StatementEntry> {
  if (useMocks) {
    return mockApi.moveTransaction(contextId, transactionId, payload)
  }
  const moved = unwrapData(
    await http.post<
      | Parameters<typeof mapTransaction>[1]
      | { data: Parameters<typeof mapTransaction>[1] }
    >(
      `/contexts/${contextId}/transactions/${transactionId}/move`,
      toMoveTransactionBody(payload),
    ),
  )
  return mapTransaction(payload.target_context_id, moved)
}

/** Efetiva um lançamento previsto (`pending` → `settled`). Idempotente. */
export async function settleTransaction(
  contextId: string,
  transactionId: string,
): Promise<StatementEntry> {
  if (useMocks) return mockApi.settleTransaction(contextId, transactionId)
  const settled = unwrapData(
    await http.post<
      | Parameters<typeof mapTransaction>[1]
      | { data: Parameters<typeof mapTransaction>[1] }
    >(`/contexts/${contextId}/transactions/${transactionId}/settle`),
  )
  return mapTransaction(contextId, settled)
}

export async function deleteTransaction(
  contextId: string,
  transactionId: string,
  scope: RecurrenceEditScope = 'this',
): Promise<void> {
  if (useMocks) return mockApi.deleteTransaction(contextId, transactionId)
  const qs = scope !== 'this' ? `?scope=${scope}` : ''
  await http.delete(`/contexts/${contextId}/transactions/${transactionId}${qs}`)
}
