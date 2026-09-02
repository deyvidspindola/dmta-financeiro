import { useMocks } from '@/api/config'
import { http } from '@/api/http'
import {
  mapConsolidatedDashboard,
  mapDashboard,
  mapEvolutionSeries,
} from '@/api/mappers'
import { mockApi } from '@/mocks/store'
import type { DashboardSummary, EvolutionPoint } from '@/types/models'

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
  month?: string,
): Promise<DashboardSummary> {
  if (useMocks) return mockApi.getDashboard(contextId, month)

  const monthQuery = month ? `?month=${encodeURIComponent(month)}` : ''

  if (contextId === 'consolidated') {
    const raw = await http.get<{ totals: ApiDashboardSlice }>(
      `/dashboard/consolidated${monthQuery}`,
    )
    return mapConsolidatedDashboard(raw)
  }

  const raw = await http.get<ApiDashboardSlice>(
    `/contexts/${contextId}/dashboard${monthQuery}`,
  )
  return mapDashboard(contextId, contextId, raw)
}

export async function getDashboardEvolution(
  contextId: string | 'consolidated',
  months = 6,
): Promise<EvolutionPoint[]> {
  if (useMocks) return mockApi.getDashboardEvolution(contextId, months)

  if (contextId === 'consolidated') {
    const raw = await http.get<{ series: EvolutionPoint[] }>(
      `/dashboard/consolidated/evolution?months=${months}`,
    )
    return mapEvolutionSeries(raw)
  }

  const raw = await http.get<{ series: EvolutionPoint[] }>(
    `/contexts/${contextId}/dashboard/evolution?months=${months}`,
  )
  return mapEvolutionSeries(raw)
}
