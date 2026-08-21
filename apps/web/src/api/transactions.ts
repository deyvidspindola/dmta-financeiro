import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import { mockApi } from '@/mocks/store'
import type { StatementEntry } from '@/types/models'

export type CreateTransactionInput = Omit<
  StatementEntry,
  'id' | 'context_id' | 'origin'
>

export async function listTransactions(
  contextId: string,
): Promise<StatementEntry[]> {
  if (useMocks) return mockApi.listTransactions(contextId)
  return unwrapData(
    await http.get<StatementEntry[] | { data: StatementEntry[] }>(
      `/api/v1/contexts/${contextId}/transactions`,
    ),
  )
}

export async function createTransaction(
  contextId: string,
  payload: CreateTransactionInput,
): Promise<StatementEntry> {
  if (useMocks) return mockApi.createTransaction(contextId, payload)
  return unwrapData(
    await http.post<StatementEntry | { data: StatementEntry }>(
      `/api/v1/contexts/${contextId}/transactions`,
      payload,
    ),
  )
}
