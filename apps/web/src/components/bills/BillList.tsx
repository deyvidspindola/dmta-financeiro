import { Banknote, Pencil, Trash2 } from 'lucide-react'
import { TransactionOriginBadge } from '@/components/transactions/TransactionOriginBadge'
import {
  billMoneyDirection,
  billStatusTone,
  effectiveBillStatus,
  isDueSoon,
} from '@/components/bills/billDisplay'
import {
  Badge,
  CategoryChip,
  DataTable,
  IconButton,
  MoneyValue,
  Td,
  Tr,
} from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { Bill } from '@/types/models'

const b = strings.bills

type CategoryInfo = { name: string; colorIndex: number }

type BillListProps = {
  rows: Bill[]
  categoryMap: Map<string, CategoryInfo>
  isConsolidated?: boolean
  canMutate?: boolean
  onPay?: (bill: Bill) => void
  onEdit?: (bill: Bill) => void
  onDelete?: (billId: string) => void
  deletePending?: boolean
}

export function BillList({
  rows,
  categoryMap,
  isConsolidated = false,
  canMutate = false,
  onPay,
  onEdit,
  onDelete,
  deletePending,
}: BillListProps) {
  if (rows.length === 0) return null

  return (
    <DataTable
      headers={[
        ...(isConsolidated ? [strings.common.context] : []),
        b.description,
        b.dueDate,
        b.status,
        { label: b.amount, right: true },
        b.category,
        ...(isConsolidated ? [] : [strings.common.actions]),
      ]}
    >
      {rows.map((bill) => {
        const status = effectiveBillStatus(bill)
        const category = bill.category_id
          ? categoryMap.get(bill.category_id)
          : undefined
        const dueSoon = isDueSoon(bill)

        return (
          <Tr key={`${bill.context_id}-${bill.id}`}>
            {isConsolidated ? (
              <Td>{bill.context?.name ?? '—'}</Td>
            ) : null}
            <Td>
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">{bill.description}</span>
                <TransactionOriginBadge origin={bill.origin} />
              </div>
            </Td>
            <Td>
              <span
                className={cn(
                  status === 'overdue' && 'font-semibold text-negative',
                  dueSoon && status === 'pending' && 'font-medium text-warning',
                )}
              >
                {formatDate(bill.due_date)}
              </span>
              {dueSoon ? (
                <Badge tone="warning" className="ml-2">
                  {b.dueSoon}
                </Badge>
              ) : null}
            </Td>
            <Td>
              <Badge tone={billStatusTone(status)} dot>
                {b.statuses[status]}
              </Badge>
            </Td>
            <Td right>
              <MoneyValue
                amount={bill.amount}
                direction={billMoneyDirection(bill.kind)}
                size="sm"
              />
            </Td>
            <Td>
              {category ? (
                <CategoryChip
                  name={category.name}
                  colorIndex={category.colorIndex}
                />
              ) : (
                '—'
              )}
            </Td>
            {!isConsolidated ? (
              <Td>
                <div className="flex items-center gap-1">
                  {(status === 'pending' || status === 'overdue') && onPay ? (
                    <IconButton
                      label={b.pay}
                      icon={Banknote}
                      onClick={() => onPay(bill)}
                      disabled={!canMutate}
                    />
                  ) : null}
                  {onEdit ? (
                    <IconButton
                      label={strings.common.edit}
                      icon={Pencil}
                      onClick={() => onEdit(bill)}
                      disabled={!canMutate}
                    />
                  ) : null}
                  {onDelete ? (
                    <IconButton
                      label={strings.common.delete}
                      icon={Trash2}
                      variant="danger"
                      onClick={() => onDelete(bill.id)}
                      disabled={deletePending || !canMutate}
                    />
                  ) : null}
                </div>
              </Td>
            ) : null}
          </Tr>
        )
      })}
    </DataTable>
  )
}
