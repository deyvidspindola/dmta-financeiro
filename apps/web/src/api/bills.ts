import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import { mapBill, toCreateBillBody, toUpdateBillBody } from '@/api/mappers'
import { mockApi } from '@/mocks/store'
import type { Bill } from '@/types/models'

export type CreateBillInput = Omit<Bill, 'id' | 'context_id' | 'origin'>

export type UpdateBillInput = {
  description: string
  amount: number
  due_date: string
  category_id: string | null
  barcode: string | null
}

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

export async function updateBill(
  contextId: string,
  billId: string,
  payload: UpdateBillInput,
): Promise<Bill> {
  if (useMocks) return mockApi.updateBill(contextId, billId, payload)
  const updated = unwrapData(
    await http.patch<
      | Parameters<typeof mapBill>[1]
      | { data: Parameters<typeof mapBill>[1] }
    >(`/contexts/${contextId}/bills/${billId}`, toUpdateBillBody(payload)),
  )
  return mapBill(contextId, updated)
}

export async function deleteBill(
  contextId: string,
  billId: string,
): Promise<void> {
  if (useMocks) return mockApi.deleteBill(contextId, billId)
  await http.delete(`/contexts/${contextId}/bills/${billId}`)
}
