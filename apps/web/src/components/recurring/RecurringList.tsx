import { Trash2 } from 'lucide-react'
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
import type { RecurringTransaction } from '@/types/models'

const r = strings.recurring
const tx = strings.transactions

type CategoryInfo = { name: string; colorIndex: number }
type AccountInfo = { name: string }

type RecurringListProps = {
  rows: RecurringTransaction[]
  categoryMap: Map<string, CategoryInfo>
  accountMap: Map<string, AccountInfo>
  /** Cartões — pra assinatura (recorrência com `credit_card_id`). */
  cardMap?: Map<string, AccountInfo>
  canMutate?: boolean
  onCancel?: (id: string) => void
  cancelPending?: boolean
}

export function RecurringList({
  rows,
  categoryMap,
  accountMap,
  cardMap,
  canMutate = false,
  onCancel,
  cancelPending,
}: RecurringListProps) {
  if (rows.length === 0) return null

  return (
    <DataTable
      headers={[
        r.description,
        { label: r.amount, right: true },
        r.type,
        r.interval,
        r.next,
        r.account,
        strings.bills.category,
        r.end,
        strings.common.actions,
      ]}
    >
      {rows.map((row) => {
        const category = row.category_id
          ? categoryMap.get(row.category_id)
          : undefined
        const account = row.account_id
          ? accountMap.get(row.account_id)
          : undefined
        const card = row.credit_card_id
          ? cardMap?.get(row.credit_card_id)
          : undefined

        return (
          <Tr key={row.id}>
            <Td>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{row.description}</span>
                <Badge tone={row.active ? 'success' : 'neutral'} dot>
                  {row.active ? r.active : r.inactive}
                </Badge>
              </div>
            </Td>
            <Td right>
              <MoneyValue
                amount={row.amount}
                direction={row.type === 'income' ? 'credit' : 'debit'}
                size="sm"
              />
            </Td>
            <Td>{tx.types[row.type]}</Td>
            <Td>{r.intervals[row.interval]}</Td>
            <Td>{formatDate(row.next_occurrence_date)}</Td>
            <Td>
              {row.credit_card_id
                ? `${strings.creditCards.card} · ${card?.name ?? '—'}`
                : (account?.name ?? '—')}
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
            <Td>
              {row.end_date ? formatDate(row.end_date) : r.fixed}
            </Td>
            <Td>
              {onCancel ? (
                <IconButton
                  label={r.cancel}
                  icon={Trash2}
                  variant="danger"
                  onClick={() => onCancel(row.id)}
                  disabled={cancelPending || !canMutate}
                />
              ) : null}
            </Td>
          </Tr>
        )
      })}
    </DataTable>
  )
}
