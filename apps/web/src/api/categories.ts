import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import { mapCategory, toCreateCategoryBody } from '@/api/mappers'
import { mockApi } from '@/mocks/store'
import type { Category } from '@/types/models'

export type CreateCategoryInput = Omit<Category, 'id' | 'context_id'>

export async function listCategories(contextId: string): Promise<Category[]> {
  if (useMocks) return mockApi.listCategories(contextId)
  const payload = await http.get<
    | Array<Parameters<typeof mapCategory>[1]>
    | { data: Array<Parameters<typeof mapCategory>[1]> }
  >(`/contexts/${contextId}/categories`)
  return unwrapData(payload).map((row) => mapCategory(contextId, row))
}

export async function createCategory(
  contextId: string,
  payload: CreateCategoryInput,
): Promise<Category> {
  if (useMocks) return mockApi.createCategory(contextId, payload)
  const created = unwrapData(
    await http.post<
      | Parameters<typeof mapCategory>[1]
      | { data: Parameters<typeof mapCategory>[1] }
    >(`/contexts/${contextId}/categories`, toCreateCategoryBody(payload)),
  )
  return mapCategory(contextId, { ...created, type: payload.type })
}
