import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import { mapBill, toCreateBillBody } from '@/api/mappers'
import { mockApi } from '@/mocks/store'
import type { Bill } from '@/types/models'

export type CreateBillInput = Omit<Bill, 'id' | 'context_id' | 'origin'>

export async function listBills(contextId: string): Promise<Bill[]> {
  if (useMocks) return mockApi.listBills(contextId)
  const payload = await http.get<
    | Array<Parameters<typeof mapBill>[1]>
    | { data: Array<Parameters<typeof mapBill>[1]> }
  >(`/contexts/${contextId}/bills`)
  return unwrapData(payload).map((row) => mapBill(contextId, row))
}

export async function createBill(
  contextId: string,
  payload: CreateBillInput,
): Promise<Bill> {
  if (useMocks) return mockApi.createBill(contextId, payload)
  const created = unwrapData(
    await http.post<
      | Parameters<typeof mapBill>[1]
      | { data: Parameters<typeof mapBill>[1] }
    >(`/contexts/${contextId}/bills`, toCreateBillBody(payload)),
  )
  return mapBill(contextId, created)
}

export async function deleteBill(
  contextId: string,
  billId: string,
): Promise<void> {
  if (useMocks) return mockApi.deleteBill(contextId, billId)
  await http.delete(`/contexts/${contextId}/bills/${billId}`)
}
