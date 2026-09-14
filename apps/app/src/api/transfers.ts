import { http, unwrapData } from '@/api/http';
import { mapTransaction, toCreateTransferBody } from '@/api/mappers';
import type { StatementEntry } from '@/types/models';

export type CreateTransferInput = {
  from_account_id: string;
  to_account_id: string;
  /** Contexto da conta de destino — PF ⇄ empresa quando diferente da origem. */
  to_context_id: string;
  amount: number;
  description: string;
  occurred_at: string;
};

export type TransferResult = {
  from: StatementEntry;
  to: StatementEntry;
};

/** Transferência entre contas — mesmo contexto, ou entre dois contextos do usuário. */
export async function createTransfer(
  contextId: string,
  input: CreateTransferInput,
): Promise<TransferResult> {
  const raw = unwrapData(
    await http.post<
      | { from: Parameters<typeof mapTransaction>[1]; to: Parameters<typeof mapTransaction>[1] }
      | {
          data: {
            from: Parameters<typeof mapTransaction>[1];
            to: Parameters<typeof mapTransaction>[1];
          };
        }
    >(`/contexts/${contextId}/transfers`, toCreateTransferBody(input, contextId)),
  );

  return {
    from: mapTransaction(contextId, raw.from),
    to: mapTransaction(input.to_context_id, raw.to),
  };
}
