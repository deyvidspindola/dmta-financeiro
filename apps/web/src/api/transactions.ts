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
}

export type UpdateTransactionInput = CreateTransactionInput

export type MoveTransactionInput = {
  target_context_id: string
  target_account_id: string
  target_category_id: string | null
}

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
      toUpdateTransactionBody(payload),
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

export async function deleteTransaction(
  contextId: string,
  transactionId: string,
): Promise<void> {
  if (useMocks) return mockApi.deleteTransaction(contextId, transactionId)
  await http.delete(`/contexts/${contextId}/transactions/${transactionId}`)
}
