import type { CreditDebit } from '@/components/ui/Money';
import type { StatementEntry } from '@/types/models';

/** Crédito (entrada) ou débito (saída) para colorir o valor na listagem. */
export function transactionDirection(tx: StatementEntry): CreditDebit {
  if (tx.type === 'income') return 'credit';
  if (tx.type === 'expense') return 'debit';
  return tx.transfer_pair_id && Number(tx.id) < Number(tx.transfer_pair_id) ? 'debit' : 'credit';
}
