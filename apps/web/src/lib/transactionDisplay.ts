import type { CreditDebit } from '@/components/ui-legacy'
import type { StatementEntry } from '@/types/models'

export function canMutateEntry(tx: StatementEntry): boolean {
  return !tx.transfer_pair_id && !tx.bill_id && tx.type !== 'transfer'
}

/** Crédito (entrada) ou débito (saída) para colorir o valor na listagem. */
export function transactionDirection(tx: StatementEntry): CreditDebit {
  if (tx.type === 'income') return 'credit'
  if (tx.type === 'expense') return 'debit'
  return tx.transfer_pair_id && Number(tx.id) < Number(tx.transfer_pair_id)
    ? 'debit'
    : 'credit'
}

/** Efeito do lançamento no saldo da conta (positivo = aumenta saldo). */
export function transactionBalanceEffect(tx: StatementEntry): number {
  const direction = transactionDirection(tx)
  return direction === 'credit' ? tx.amount : -tx.amount
}
