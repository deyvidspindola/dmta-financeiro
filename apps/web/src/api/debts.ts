import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import {
  mapDebt,
  toCreateDebtBody,
  toUpdateDebtBody,
} from '@/api/mappers'
import { mockApi } from '@/mocks/store'
import type { Debt, DebtDirection } from '@/types/models'

export type CreateDebtInput = {
  description: string
  amount: number
  direction: DebtDirection
  counterparty: string | null
  due_date: string | null
  notes: string | null
}

export type UpdateDebtInput = Omit<CreateDebtInput, 'direction'>

export async function listDebts(contextId: string): Promise<Debt[]> {
  if (useMocks) return mockApi.listDebts(contextId)
  const payload = await http.get<
    | Array<Parameters<typeof mapDebt>[0]>
    | { data: Array<Parameters<typeof mapDebt>[0]> }
  >(`/contexts/${contextId}/debts`)
  return unwrapData(payload).map(mapDebt)
}

export async function createDebt(
  contextId: string,
  payload: CreateDebtInput,
): Promise<Debt> {
  if (useMocks) return mockApi.createDebt(contextId, payload)
  const created = unwrapData(
    await http.post<
      | Parameters<typeof mapDebt>[0]
      | { data: Parameters<typeof mapDebt>[0] }
    >(`/contexts/${contextId}/debts`, toCreateDebtBody(payload)),
  )
  return mapDebt(created)
}

export async function updateDebt(
  contextId: string,
  debtId: string,
  payload: UpdateDebtInput,
): Promise<Debt> {
  if (useMocks) return mockApi.updateDebt(contextId, debtId, payload)
  const updated = unwrapData(
    await http.patch<
      | Parameters<typeof mapDebt>[0]
      | { data: Parameters<typeof mapDebt>[0] }
    >(
      `/contexts/${contextId}/debts/${debtId}`,
      toUpdateDebtBody(payload),
    ),
  )
  return mapDebt(updated)
}

export type SettleDebtOptions = {
  account_id?: string | null
}

export async function settleDebt(
  contextId: string,
  debtId: string,
  options?: SettleDebtOptions,
): Promise<Debt> {
  if (useMocks) return mockApi.settleDebt(contextId, debtId)
  const body =
    options?.account_id != null && options.account_id !== ''
      ? { account_id: Number(options.account_id) }
      : undefined
  const settled = unwrapData(
    await http.post<
      | Parameters<typeof mapDebt>[0]
      | { data: Parameters<typeof mapDebt>[0] }
    >(`/contexts/${contextId}/debts/${debtId}/settle`, body),
  )
  return mapDebt(settled)
}

export async function deleteDebt(
  contextId: string,
  debtId: string,
): Promise<void> {
  if (useMocks) return mockApi.deleteDebt(contextId, debtId)
  await http.delete(`/contexts/${contextId}/debts/${debtId}`)
}
