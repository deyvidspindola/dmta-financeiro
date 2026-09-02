import type { BadgeTone } from '@/components/ui'
import type { Bill, BillKind, BillStatus, MoneyDirection } from '@/types/models'

export function billMoneyDirection(kind: BillKind): 'credit' | 'debit' {
  return kind === 'receivable' ? 'credit' : 'debit'
}

export function categoryTypeForBillKind(kind: BillKind): MoneyDirection {
  return kind === 'receivable' ? 'income' : 'expense'
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Status exibido — `overdue` é derivado de pendente + vencimento passado. */
export function effectiveBillStatus(bill: Bill): BillStatus {
  if (bill.status === 'pending' && bill.due_date < todayIso()) {
    return 'overdue'
  }
  return bill.status
}

export function billStatusTone(status: BillStatus): BadgeTone {
  switch (status) {
    case 'paid':
      return 'success'
    case 'overdue':
      return 'danger'
    case 'pending':
      return 'warning'
    default:
      return 'neutral'
  }
}

export function daysUntilDue(dueDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(`${dueDate}T00:00:00`)
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000)
}

export function isDueSoon(bill: Bill): boolean {
  if (bill.status !== 'pending') return false
  const days = daysUntilDue(bill.due_date)
  return days >= 0 && days <= 7
}
