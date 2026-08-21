import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import { mockApi } from '@/mocks/store'
import type { Context } from '@/types/models'

export async function listContexts(): Promise<Context[]> {
  if (useMocks) return mockApi.listContexts()
  return unwrapData(
    await http.get<Context[] | { data: Context[] }>('/api/v1/contexts'),
  )
}
