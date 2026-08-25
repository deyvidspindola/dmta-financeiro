import { useMocks } from '@/api/config'
import { http } from '@/api/http'
import { mapSimulation } from '@/api/mappers'
import { mockApi } from '@/mocks/store'
import type {
  CashFlowProjection,
  InstallmentPurchaseSimulation,
} from '@/types/models'

export type SimulateInstallmentInput = {
  amount: number
  installments: number
  cash_price: number | null
}

export async function simulateInstallmentPurchase(
  contextId: string,
  payload: SimulateInstallmentInput,
): Promise<InstallmentPurchaseSimulation> {
  if (useMocks) {
    return mockApi.simulateInstallmentPurchase(contextId, payload)
  }
  const body: Record<string, number> = {
    amount: payload.amount,
    installments: payload.installments,
  }
  if (payload.cash_price !== null) {
    body.cash_price = payload.cash_price
  }
  const raw = await http.post<Parameters<typeof mapSimulation>[0]>(
    `/contexts/${contextId}/simulations/installment-purchase`,
    body,
  )
  return mapSimulation(raw)
}

export async function getCashFlow(
  contextId: string,
): Promise<CashFlowProjection> {
  if (useMocks) return mockApi.getCashFlow(contextId)
  return http.get<CashFlowProjection>(`/contexts/${contextId}/cash-flow`)
}
