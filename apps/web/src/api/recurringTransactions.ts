import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import {
  mapRecurringTransaction,
  toCreateRecurringBody,
} from '@/api/mappers'
import { mockApi } from '@/mocks/store'
import type {
  MoneyDirection,
  RecurrenceInterval,
  RecurringTransaction,
} from '@/types/models'

export type CreateRecurringInput = {
  account_id: string
  category_id: string | null
  description: string
  amount: number
  type: MoneyDirection
  interval: RecurrenceInterval
  start_date: string
  end_date: string | null
}

export async function listRecurringTransactions(
  contextId: string,
): Promise<RecurringTransaction[]> {
  if (useMocks) return mockApi.listRecurringTransactions(contextId)
  const payload = await http.get<
    | Array<Parameters<typeof mapRecurringTransaction>[1]>
    | { data: Array<Parameters<typeof mapRecurringTransaction>[1]> }
  >(`/contexts/${contextId}/recurring-transactions`)
  return unwrapData(payload).map((row) =>
    mapRecurringTransaction(contextId, row),
  )
}

export async function createRecurringTransaction(
  contextId: string,
  payload: CreateRecurringInput,
): Promise<RecurringTransaction> {
  if (useMocks) return mockApi.createRecurringTransaction(contextId, payload)
  const created = unwrapData(
    await http.post<
      | Parameters<typeof mapRecurringTransaction>[1]
      | { data: Parameters<typeof mapRecurringTransaction>[1] }
    >(
      `/contexts/${contextId}/recurring-transactions`,
      toCreateRecurringBody(payload),
    ),
  )
  return mapRecurringTransaction(contextId, created)
}

export async function deleteRecurringTransaction(
  contextId: string,
  recurringId: string,
): Promise<void> {
  if (useMocks) {
    return mockApi.deleteRecurringTransaction(contextId, recurringId)
  }
  await http.delete(
    `/contexts/${contextId}/recurring-transactions/${recurringId}`,
  )
}
