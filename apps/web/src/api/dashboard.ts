import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import { mockApi } from '@/mocks/store'
import type { DashboardSummary } from '@/types/models'

export async function getDashboard(
  contextId: string | 'consolidated',
): Promise<DashboardSummary> {
  if (useMocks) return mockApi.getDashboard(contextId)
  const path =
    contextId === 'consolidated'
      ? '/api/v1/dashboard/consolidated'
      : `/api/v1/contexts/${contextId}/dashboard`
  return unwrapData(
    await http.get<DashboardSummary | { data: DashboardSummary }>(path),
  )
}
