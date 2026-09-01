import { http, unwrapData } from '@/api/http';
import { mapContext } from '@/api/mappers';
import type { Context } from '@/types/models';

export async function listContexts(): Promise<Context[]> {
  const payload = await http.get<
    Parameters<typeof mapContext>[0][] | { data: Parameters<typeof mapContext>[0][] }
  >('/contexts');
  return unwrapData(payload).map(mapContext);
}
