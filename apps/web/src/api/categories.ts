import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import { mockApi } from '@/mocks/store'
import type { Category } from '@/types/models'

export type CreateCategoryInput = Omit<Category, 'id' | 'context_id'>

export async function listCategories(contextId: string): Promise<Category[]> {
  if (useMocks) return mockApi.listCategories(contextId)
  return unwrapData(
    await http.get<Category[] | { data: Category[] }>(
      `/api/v1/contexts/${contextId}/categories`,
    ),
  )
}

export async function createCategory(
  contextId: string,
  payload: CreateCategoryInput,
): Promise<Category> {
  if (useMocks) return mockApi.createCategory(contextId, payload)
  return unwrapData(
    await http.post<Category | { data: Category }>(
      `/api/v1/contexts/${contextId}/categories`,
      payload,
    ),
  )
}
