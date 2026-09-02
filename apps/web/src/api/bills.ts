import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import {
  mapBill,
  toCreateBillBody,
  toPayBillBody,
  toUpdateBillBody,
} from '@/api/mappers'
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

export type BillListFilters = {
  from?: string
  to?: string
  status?: 'pending' | 'paid' | 'overdue' | 'cancelled'
  direction?: 'payable' | 'receivable'
  category_id?: string
  q?: string
}

function buildFilterQuery(filters?: BillListFilters): string {
  if (!filters) return ''
  const params = new URLSearchParams()
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  if (filters.status) params.set('status', filters.status)
  if (filters.direction) params.set('direction', filters.direction)
  if (filters.category_id) params.set('category_id', filters.category_id)
  if (filters.q?.trim()) params.set('q', filters.q.trim())
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export async function listBills(
  contextId: string,
  filters?: BillListFilters,
): Promise<Bill[]> {
  if (useMocks) return mockApi.listBills(contextId, filters)
  const payload = await http.get<
    | Array<Parameters<typeof mapBill>[1]>
    | { data: Array<Parameters<typeof mapBill>[1]> }
  >(`/contexts/${contextId}/bills${buildFilterQuery(filters)}`)
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

export type PayBillInput = {
  account_id: string
  occurred_at: string | null
}

export async function payBill(
  contextId: string,
  billId: string,
  payload: PayBillInput,
): Promise<void> {
  if (useMocks) return mockApi.payBill(contextId, billId, payload)
  await http.post(
    `/contexts/${contextId}/bills/${billId}/pay`,
    toPayBillBody(payload),
  )
}
