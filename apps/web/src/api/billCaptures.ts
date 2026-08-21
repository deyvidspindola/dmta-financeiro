import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import {
  mapBill,
  mapBillCapture,
  toConfirmBillCaptureBody,
} from '@/api/mappers'
import { mockApi } from '@/mocks/store'
import type { Bill, BillCapture, BillCaptureStatus, BillKind } from '@/types/models'

export type BillCaptureListStatus = BillCaptureStatus | 'all'

export type ConfirmBillCaptureInput = {
  context_id: string
  description: string
  amount: number
  due_date: string
  direction: BillKind
  category_id: string | null
  beneficiary: string | null
}

export async function listBillCaptures(
  status: BillCaptureListStatus = 'pending',
): Promise<BillCapture[]> {
  if (useMocks) return mockApi.listBillCaptures(status)
  const query = `?status=${status}`
  const payload = await http.get<
    | Array<Parameters<typeof mapBillCapture>[0]>
    | { data: Array<Parameters<typeof mapBillCapture>[0]> }
  >(`/bill-captures${query}`)
  return unwrapData(payload).map(mapBillCapture)
}

export async function confirmBillCapture(
  captureId: string,
  payload: ConfirmBillCaptureInput,
): Promise<Bill> {
  if (useMocks) return mockApi.confirmBillCapture(captureId, payload)
  const created = unwrapData(
    await http.post<
      | Parameters<typeof mapBill>[1]
      | { data: Parameters<typeof mapBill>[1] }
    >(
      `/bill-captures/${captureId}/confirm`,
      toConfirmBillCaptureBody(payload),
    ),
  )
  return mapBill(payload.context_id, {
    ...created,
    // BillResource may omit context_id / barcode; keep UI shape stable.
    origin: created.origin ?? 'email',
  })
}

export async function rejectBillCapture(captureId: string): Promise<void> {
  if (useMocks) return mockApi.rejectBillCapture(captureId)
  await http.post(`/bill-captures/${captureId}/reject`)
}
