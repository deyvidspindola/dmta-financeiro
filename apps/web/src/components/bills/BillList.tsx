import { useMemo, type ReactNode } from 'react'
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
  IconButton,
  Modal,
  MoneyValue,
  StatementGroup,
  StatementList,
  StatementRow,
} from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { Bill } from '@/types/models'

const b = strings.bills

type CategoryInfo = { name: string; colorIndex: number }

function groupByDueDate(rows: Bill[]): [string, Bill[]][] {
  const map = new Map<string, Bill[]>()
  for (const bill of rows) {
    const day = bill.due_date
    const list = map.get(day) ?? []
    list.push(bill)
    map.set(day, list)
  }
  return [...map.entries()].sort(([a], [b]) => b.localeCompare(a))
}

type BillListProps = {
  rows: Bill[]
  categoryMap: Map<string, CategoryInfo>
  isConsolidated?: boolean
  onSelect: (bill: Bill) => void
}

export function BillList({
  rows,
  categoryMap,
  isConsolidated = false,
  onSelect,
}: BillListProps) {
  const grouped = useMemo(() => groupByDueDate(rows), [rows])

  if (rows.length === 0) return null

  return (
    <StatementList>
      {grouped.map(([day, dayRows]) => (
        <StatementGroup key={day} label={formatDate(day)}>
          {dayRows.map((bill) => {
            const status = effectiveBillStatus(bill)
            const category = bill.category_id
              ? categoryMap.get(bill.category_id)
              : undefined
            const dueSoon = isDueSoon(bill)

            return (
              <StatementRow
                key={`${bill.context_id}-${bill.id}`}
                title={bill.description}
                ariaLabel={`${bill.description}, ${b.statuses[status]}`}
                onClick={() => onSelect(bill)}
                meta={
                  <>
                    <Badge tone={billStatusTone(status)} dot>
                      {b.statuses[status]}
                    </Badge>
                    {dueSoon ? (
                      <Badge tone="warning">{b.dueSoon}</Badge>
                    ) : null}
                    {category ? (
                      <CategoryChip
                        name={category.name}
                        colorIndex={category.colorIndex}
                      />
                    ) : null}
                    {isConsolidated && bill.context ? (
                      <Badge tone="neutral">{bill.context.name}</Badge>
                    ) : null}
                    <TransactionOriginBadge origin={bill.origin} />
                  </>
                }
                amount={
                  <MoneyValue
                    amount={bill.amount}
                    direction={billMoneyDirection(bill.kind)}
                    size="sm"
                  />
                }
              />
            )
          })}
        </StatementGroup>
      ))}
    </StatementList>
  )
}

type BillDetailModalProps = {
  bill: Bill
  category?: CategoryInfo
  canMutate: boolean
  deletePending?: boolean
  onClose: () => void
  onPay?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function BillDetailModal({
  bill,
  category,
  canMutate,
  deletePending,
  onClose,
  onPay,
  onEdit,
  onDelete,
}: BillDetailModalProps) {
  const status = effectiveBillStatus(bill)
  const dueSoon = isDueSoon(bill)
  const canPay = status === 'pending' || status === 'overdue'

  return (
    <Modal
      title={bill.description}
      size="lg"
      onClose={onClose}
      footer={
        canMutate ? (
          <div className="flex w-full flex-wrap items-center justify-end gap-1">
            {canPay && onPay ? (
              <IconButton label={b.pay} icon={Banknote} onClick={onPay} />
            ) : null}
            {onEdit ? (
              <IconButton
                label={strings.common.edit}
                icon={Pencil}
                onClick={onEdit}
              />
            ) : null}
            {onDelete ? (
              <IconButton
                label={strings.common.delete}
                icon={Trash2}
                variant="danger"
                onClick={onDelete}
                disabled={deletePending}
              />
            ) : null}
          </div>
        ) : undefined
      }
    >
      <div className="space-y-6">
        <div className="text-center">
          <MoneyValue
            amount={bill.amount}
            direction={billMoneyDirection(bill.kind)}
            size="lg"
          />
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <Badge tone={billStatusTone(status)} dot>
              {b.statuses[status]}
            </Badge>
            <Badge tone="neutral">{b.kinds[bill.kind]}</Badge>
            {dueSoon ? <Badge tone="warning">{b.dueSoon}</Badge> : null}
            <TransactionOriginBadge origin={bill.origin} />
          </div>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <DetailItem label={b.dueDate}>
            <span
              className={cn(
                status === 'overdue' && 'font-semibold text-negative',
                dueSoon && status === 'pending' && 'font-medium text-warning',
              )}
            >
              {formatDate(bill.due_date)}
            </span>
          </DetailItem>
          <DetailItem label={b.category}>
            {category ? (
              <CategoryChip
                name={category.name}
                colorIndex={category.colorIndex}
              />
            ) : (
              '—'
            )}
          </DetailItem>
          {bill.barcode ? (
            <DetailItem label={b.barcode}>
              <span className="break-all font-mono text-xs">{bill.barcode}</span>
            </DetailItem>
          ) : null}
          {bill.context ? (
            <DetailItem label={strings.common.context}>
              {bill.context.name}
            </DetailItem>
          ) : null}
        </dl>
      </div>
    </Modal>
  )
}

function DetailItem({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-fg">{children}</dd>
    </div>
  )
}
