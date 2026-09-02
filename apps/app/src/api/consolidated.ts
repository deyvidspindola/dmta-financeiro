import { http, unwrapData } from '@/api/http';
import { mapAccount, mapTransaction } from '@/api/mappers';
import type { Account, StatementEntry } from '@/types/models';

export async function listConsolidatedAccounts(): Promise<Account[]> {
  const payload = await http.get<
    Parameters<typeof mapAccount>[1][] | { data: Parameters<typeof mapAccount>[1][] }
  >('/consolidated/accounts');
  return unwrapData(payload).map((row) =>
    mapAccount(row.context ? String(row.context.id) : '', row),
  );
}

export async function listConsolidatedTransactions(): Promise<StatementEntry[]> {
  const payload = await http.get<
    Parameters<typeof mapTransaction>[1][] | { data: Parameters<typeof mapTransaction>[1][] }
  >('/consolidated/transactions');
  return unwrapData(payload).map((row) =>
    mapTransaction(row.context ? String(row.context.id) : '', row),
  );
}
