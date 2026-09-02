import { http, unwrapData } from '@/api/http';
import { mapCategory } from '@/api/mappers';
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
