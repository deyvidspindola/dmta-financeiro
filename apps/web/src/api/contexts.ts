import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import { mapContext } from '@/api/mappers'
import { mockApi } from '@/mocks/store'
import type { Context } from '@/types/models'

export async function listContexts(): Promise<Context[]> {
  if (useMocks) return mockApi.listContexts()
  const payload = await http.get<
    | Array<Parameters<typeof mapContext>[0]>
    | { data: Array<Parameters<typeof mapContext>[0]> }
  >('/contexts')
  return unwrapData(payload).map(mapContext)
}
