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

export type PollBillCapturesResult = {
  processed: number
  captured: number
}

export type ConfirmBillCaptureInput = {
  context_id: string
  description: string
  amount: number
  due_date: string
  direction: BillKind
  category_id: string | null
  beneficiary: string | null
}

export type SaveBoletoPasswordRuleInput = {
  sender_domain: string
  rule_type: 'fixed'
  rule_params: { password: string }
  label?: string
}

export async function listBillCaptures(
  status: BillCaptureListStatus = 'pending',
  month: string | null = null,
): Promise<BillCapture[]> {
  if (useMocks) return mockApi.listBillCaptures(status, month)
  const params = new URLSearchParams({ status })
  if (month) params.set('month', month)
  const payload = await http.get<
    | Array<Parameters<typeof mapBillCapture>[0]>
    | { data: Array<Parameters<typeof mapBillCapture>[0]> }
  >(`/bill-captures?${params.toString()}`)
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

export async function deleteBillCapture(captureId: string): Promise<void> {
  if (useMocks) return mockApi.deleteBillCapture(captureId)
  await http.delete(`/bill-captures/${captureId}`)
}

/** Dispara a captura na hora, sem esperar o próximo ciclo do agendador (a cada 5 minutos). */
export async function pollBillCaptures(): Promise<PollBillCapturesResult> {
  if (useMocks) return mockApi.pollBillCaptures()
  return http.post<PollBillCapturesResult>('/bill-captures/poll')
}

export async function unlockBillCapture(
  captureId: string,
  password: string,
): Promise<BillCapture> {
  if (useMocks) return mockApi.unlockBillCapture(captureId, password)
  const payload = await http.post<
    | Parameters<typeof mapBillCapture>[0]
    | { data: Parameters<typeof mapBillCapture>[0] }
  >(`/bill-captures/${captureId}/unlock`, { password })
  return mapBillCapture(unwrapData(payload))
}

export async function saveBoletoPasswordRule(
  input: SaveBoletoPasswordRuleInput,
): Promise<void> {
  if (useMocks) return mockApi.saveBoletoPasswordRule(input)
  await http.post('/boleto-password-rules', input)
}
