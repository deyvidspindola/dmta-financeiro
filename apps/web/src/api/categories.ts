import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import {
  mapCategory,
  toCreateCategoryBody,
  toUpdateCategoryBody,
} from '@/api/mappers'
import { mockApi } from '@/mocks/store'
import type { Category, MoneyDirection } from '@/types/models'

export type CreateCategoryInput = Omit<Category, 'id' | 'context_id'>

export type ListCategoriesOptions = {
  type?: MoneyDirection
}

export async function listCategories(
  contextId: string,
  options: ListCategoriesOptions = {},
): Promise<Category[]> {
  if (useMocks) return mockApi.listCategories(contextId, options.type)
  const query = options.type ? `?type=${options.type}` : ''
  const payload = await http.get<
    | Array<Parameters<typeof mapCategory>[1]>
    | { data: Array<Parameters<typeof mapCategory>[1]> }
  >(`/contexts/${contextId}/categories${query}`)
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
  return mapCategory(contextId, created)
}

export async function updateCategory(
  contextId: string,
  categoryId: string,
  payload: { name: string },
): Promise<Category> {
  if (useMocks) return mockApi.updateCategory(contextId, categoryId, payload)
  const updated = unwrapData(
    await http.patch<
      | Parameters<typeof mapCategory>[1]
      | { data: Parameters<typeof mapCategory>[1] }
    >(
      `/contexts/${contextId}/categories/${categoryId}`,
      toUpdateCategoryBody(payload),
    ),
  )
  return mapCategory(contextId, updated)
}

export async function deleteCategory(
  contextId: string,
  categoryId: string,
): Promise<void> {
  if (useMocks) return mockApi.deleteCategory(contextId, categoryId)
  await http.delete(`/contexts/${contextId}/categories/${categoryId}`)
}
