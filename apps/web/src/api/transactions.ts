import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import { mapTransaction, toCreateTransactionBody } from '@/api/mappers'
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
  const payload = await http.get<
    | Array<Parameters<typeof mapTransaction>[1]>
    | { data: Array<Parameters<typeof mapTransaction>[1]> }
  >(`/contexts/${contextId}/transactions`)
  return unwrapData(payload).map((row) => mapTransaction(contextId, row))
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
