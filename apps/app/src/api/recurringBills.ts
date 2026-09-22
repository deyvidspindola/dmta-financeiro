import { http, unwrapData } from '@/api/http';
import { mapRecurringBill, toCreateRecurringBillBody } from '@/api/mappers';
import type { BillKind, RecurrenceInterval, RecurringBill } from '@/types/models';

export type CreateRecurringBillInput = {
  category_id: string | null;
  description: string;
  amount: number;
  direction: BillKind;
  interval: RecurrenceInterval;
  start_date: string;
  end_date: string | null;
};

export async function listRecurringBills(contextId: string): Promise<RecurringBill[]> {
  const payload = await http.get<
    Parameters<typeof mapRecurringBill>[1][] | { data: Parameters<typeof mapRecurringBill>[1][] }
  >(`/contexts/${contextId}/recurring-bills`);
  return unwrapData(payload).map((row) => mapRecurringBill(contextId, row));
}

/**
 * Cadastra a regra e já materializa a ocorrência do mês corrente na
 * mesma chamada — ver `RegisterRecurringBill` no apps/api.
 */
export async function createRecurringBill(
  contextId: string,
  input: CreateRecurringBillInput,
): Promise<RecurringBill> {
  const payload = await http.post<
    Parameters<typeof mapRecurringBill>[1] | { data: Parameters<typeof mapRecurringBill>[1] }
  >(`/contexts/${contextId}/recurring-bills`, toCreateRecurringBillBody(input));
  return mapRecurringBill(contextId, unwrapData(payload));
}

export async function deleteRecurringBill(
  contextId: string,
  recurringBillId: string,
): Promise<void> {
  await http.delete(`/contexts/${contextId}/recurring-bills/${recurringBillId}`);
}
