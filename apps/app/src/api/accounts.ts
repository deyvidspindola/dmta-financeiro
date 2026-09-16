import { http, unwrapData } from '@/api/http';
import { mapAccount, toCreateAccountBody, toUpdateAccountBody } from '@/api/mappers';
import type { Account, AccountType } from '@/types/models';

/**
 * `month` (YYYY-MM) opcional — mês fechado devolve o saldo de cada conta
 * como estava no fim daquele mês (replay no backend); mês atual/futuro (ou
 * omitido) devolve o saldo de agora, igual antes.
 *
 * Retorna também os totais (saldo atual e previsto) em `meta.totals`.
 */
export async function listAccounts(
  contextId: string,
  month?: string,
): Promise<{ accounts: Account[]; totals?: { current_balance: number; projected_balance: number } }> {
  const query = month ? `?month=${encodeURIComponent(month)}` : '';
  const payload = await http.get<
    | Parameters<typeof mapAccount>[1][]
    | {
        data: Parameters<typeof mapAccount>[1][];
        meta?: { totals?: { current_balance: number; projected_balance: number } };
      }
  >(`/contexts/${contextId}/accounts${query}`);

  if (Array.isArray(payload)) {
    return { accounts: payload.map((row) => mapAccount(contextId, row)) };
  }

  return {
    accounts: payload.data.map((row) => mapAccount(contextId, row)),
    totals: payload.meta?.totals,
  };
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
  input: Omit<AccountInput, 'balance'> & { include_in_dashboard?: boolean },
): Promise<Account> {
  const payload = await http.patch<
    Parameters<typeof mapAccount>[1] | { data: Parameters<typeof mapAccount>[1] }
  >(
    `/contexts/${contextId}/accounts/${accountId}`,
    toUpdateAccountBody({ ...input, include_in_dashboard: input.include_in_dashboard }),
  );
  return mapAccount(contextId, unwrapData(payload));
}

export async function deleteAccount(contextId: string, accountId: string): Promise<void> {
  await http.delete(`/contexts/${contextId}/accounts/${accountId}`);
}
