import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import { mapRecurringBill, toCreateRecurringBillBody } from '@/api/mappers'
import { mockApi } from '@/mocks/store'
import type { BillKind, RecurrenceInterval, RecurringBill } from '@/types/models'

export type CreateRecurringBillInput = {
  category_id: string | null
  description: string
  amount: number
  direction: BillKind
  interval: RecurrenceInterval
  start_date: string
  end_date: string | null
}

export async function listRecurringBills(
  contextId: string,
): Promise<RecurringBill[]> {
  if (useMocks) return mockApi.listRecurringBills(contextId)
  const payload = await http.get<
    | Array<Parameters<typeof mapRecurringBill>[1]>
    | { data: Array<Parameters<typeof mapRecurringBill>[1]> }
  >(`/contexts/${contextId}/recurring-bills`)
  return unwrapData(payload).map((row) => mapRecurringBill(contextId, row))
}

export async function createRecurringBill(
  contextId: string,
  payload: CreateRecurringBillInput,
): Promise<RecurringBill> {
  if (useMocks) return mockApi.createRecurringBill(contextId, payload)
  const created = unwrapData(
    await http.post<
      | Parameters<typeof mapRecurringBill>[1]
      | { data: Parameters<typeof mapRecurringBill>[1] }
    >(`/contexts/${contextId}/recurring-bills`, toCreateRecurringBillBody(payload)),
  )
  return mapRecurringBill(contextId, created)
}

export async function deleteRecurringBill(
  contextId: string,
  recurringBillId: string,
): Promise<void> {
  if (useMocks) return mockApi.deleteRecurringBill(contextId, recurringBillId)
  await http.delete(`/contexts/${contextId}/recurring-bills/${recurringBillId}`)
}
