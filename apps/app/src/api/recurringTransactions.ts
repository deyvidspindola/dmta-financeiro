import { http, unwrapData } from '@/api/http';

export type RecurrenceInterval = 'weekly' | 'monthly' | 'yearly';

export type CreateRecurringTransactionInput = {
  account_id: string;
  category_id: string | null;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  interval: RecurrenceInterval;
  start_date: string;
  /** `null` = "despesa fixa" (recorrência indefinida). */
  end_date: string | null;
};

type RecurringTransactionPayload = {
  id: string;
  account_id: string;
  category_id: string | null;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  interval: RecurrenceInterval;
  start_date: string;
  end_date: string | null;
  next_occurrence_date: string;
  is_fixed: boolean;
  active: boolean;
};

/**
 * Cadastra a regra e já materializa a ocorrência do mês corrente na
 * mesma chamada — ver `RegisterRecurringTransaction` no apps/api. Não
 * precisa criar a transação avulsa depois: essa chamada já cobre "hoje".
 */
export async function createRecurringTransaction(
  contextId: string,
  input: CreateRecurringTransactionInput,
): Promise<RecurringTransactionPayload> {
  const payload = await http.post<
    RecurringTransactionPayload | { data: RecurringTransactionPayload }
  >(`/contexts/${contextId}/recurring-transactions`, {
    ...input,
    category_id: input.category_id ?? undefined,
    end_date: input.end_date ?? undefined,
  });
  return unwrapData(payload);
}
