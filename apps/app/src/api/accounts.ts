import { http, unwrapData } from '@/api/http';
import { mapAccount } from '@/api/mappers';
import type { Account } from '@/types/models';

export async function listAccounts(contextId: string): Promise<Account[]> {
  const payload = await http.get<
    Parameters<typeof mapAccount>[1][] | { data: Parameters<typeof mapAccount>[1][] }
  >(`/contexts/${contextId}/accounts`);
  return unwrapData(payload).map((row) => mapAccount(contextId, row));
}
