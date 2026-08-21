import { useMocks } from '@/api/config'
import { http } from '@/api/http'
import { mapConsolidatedDashboard, mapDashboard } from '@/api/mappers'
import { mockApi } from '@/mocks/store'
import type { DashboardSummary } from '@/types/models'

type ApiDashboardSlice = {
  context_id?: string | number
  accounts_balance: number
  pending_bills_amount: number
  overdue_bills_count: number
  month_income: number
  month_expense: number
  investments_total: number
}

export async function getDashboard(
  contextId: string | 'consolidated',
): Promise<DashboardSummary> {
  if (useMocks) return mockApi.getDashboard(contextId)

  if (contextId === 'consolidated') {
    const raw = await http.get<{ totals: ApiDashboardSlice }>(
      '/dashboard/consolidated',
    )
    return mapConsolidatedDashboard(raw)
  }

  const raw = await http.get<ApiDashboardSlice>(
    `/contexts/${contextId}/dashboard`,
  )
  return mapDashboard(contextId, contextId, raw)
}
