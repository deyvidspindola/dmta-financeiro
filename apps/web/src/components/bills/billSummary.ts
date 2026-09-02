import { effectiveBillStatus } from '@/components/bills/billDisplay'
import type { Bill } from '@/types/models'

export type BillSummary = {
  payablePending: number
  overdue: number
  receivablePending: number
}

export function summarizeBills(rows: Bill[]): BillSummary {
  return rows.reduce(
    (acc, bill) => {
      const status = effectiveBillStatus(bill)
      if (bill.kind === 'payable') {
        if (status === 'pending') acc.payablePending += bill.amount
        if (status === 'overdue') acc.overdue += bill.amount
      } else if (bill.kind === 'receivable' && status === 'pending') {
        acc.receivablePending += bill.amount
      }
      return acc
    },
    { payablePending: 0, overdue: 0, receivablePending: 0 },
  )
}
