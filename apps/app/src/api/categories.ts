import { http, unwrapData } from '@/api/http';
import { mapCategory, toCreateCategoryBody, toUpdateCategoryBody } from '@/api/mappers';
import type { Category, MoneyDirection } from '@/types/models';

export type ListCategoriesOptions = {
  type?: MoneyDirection;
};

export async function listCategories(
  contextId: string,
  options: ListCategoriesOptions = {},
): Promise<Category[]> {
  const query = options.type ? `?type=${options.type}` : '';
  const payload = await http.get<
    Parameters<typeof mapCategory>[1][] | { data: Parameters<typeof mapCategory>[1][] }
  >(`/contexts/${contextId}/categories${query}`);
  return unwrapData(payload).map((row) => mapCategory(contextId, row));
}

export async function createCategory(
  contextId: string,
  input: { name: string; type: MoneyDirection; parent_id: string | null },
): Promise<Category> {
  const payload = await http.post<
    Parameters<typeof mapCategory>[1] | { data: Parameters<typeof mapCategory>[1] }
  >(`/contexts/${contextId}/categories`, toCreateCategoryBody(input));
  return mapCategory(contextId, unwrapData(payload));
}

export async function updateCategory(
  contextId: string,
  categoryId: string,
  input: { name: string },
): Promise<Category> {
  const payload = await http.patch<
    Parameters<typeof mapCategory>[1] | { data: Parameters<typeof mapCategory>[1] }
  >(`/contexts/${contextId}/categories/${categoryId}`, toUpdateCategoryBody(input));
  return mapCategory(contextId, unwrapData(payload));
}

export async function deleteCategory(contextId: string, categoryId: string): Promise<void> {
  await http.delete(`/contexts/${contextId}/categories/${categoryId}`);
}
