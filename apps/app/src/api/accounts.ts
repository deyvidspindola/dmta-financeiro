import { http, unwrapData } from '@/api/http';
import { mapAccount, toCreateAccountBody, toUpdateAccountBody } from '@/api/mappers';
import type { Account, AccountType } from '@/types/models';

export async function listAccounts(contextId: string): Promise<Account[]> {
  const payload = await http.get<
    Parameters<typeof mapAccount>[1][] | { data: Parameters<typeof mapAccount>[1][] }
  >(`/contexts/${contextId}/accounts`);
  return unwrapData(payload).map((row) => mapAccount(contextId, row));
}

export type AccountInput = {
  name: string;
  bank_name: string | null;
  type: AccountType;
  balance: number;
};

export async function createAccount(contextId: string, input: AccountInput): Promise<Account> {
  const payload = await http.post<
    Parameters<typeof mapAccount>[1] | { data: Parameters<typeof mapAccount>[1] }
  >(`/contexts/${contextId}/accounts`, toCreateAccountBody(input));
  return mapAccount(contextId, unwrapData(payload));
}

export async function updateAccount(
  contextId: string,
  accountId: string,
  input: Omit<AccountInput, 'balance'>,
): Promise<Account> {
  const payload = await http.patch<
    Parameters<typeof mapAccount>[1] | { data: Parameters<typeof mapAccount>[1] }
  >(`/contexts/${contextId}/accounts/${accountId}`, toUpdateAccountBody(input));
  return mapAccount(contextId, unwrapData(payload));
}

export async function deleteAccount(contextId: string, accountId: string): Promise<void> {
  await http.delete(`/contexts/${contextId}/accounts/${accountId}`);
}
