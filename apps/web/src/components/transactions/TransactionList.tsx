import { useMemo } from 'react'
import {
  Badge,
  CategoryChip,
  MoneyValue,
  StatementGroup,
  StatementList,
  StatementRow,
} from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { formatDate } from '@/lib/format'
import { transactionDirection } from '@/lib/transactionDisplay'
import type { StatementEntry } from '@/types/models'

const t = strings.transactions

type CategoryInfo = { name: string; colorIndex: number }
type AccountInfo = { name: string }

function groupByDay(rows: StatementEntry[]): [string, StatementEntry[]][] {
  const map = new Map<string, StatementEntry[]>()
  for (const tx of rows) {
    const day = tx.date
    const list = map.get(day) ?? []
    list.push(tx)
    map.set(day, list)
  }
  return [...map.entries()].sort(([a], [b]) => b.localeCompare(a))
}

type TransactionListProps = {
  rows: StatementEntry[]
  categoryMap: Map<string, CategoryInfo>
  accountMap: Map<string, AccountInfo>
  isConsolidated?: boolean
  onSelect: (tx: StatementEntry) => void
}

export function TransactionList({
  rows,
  categoryMap,
  accountMap,
  isConsolidated = false,
  onSelect,
}: TransactionListProps) {
  const grouped = useMemo(() => groupByDay(rows), [rows])

  if (rows.length === 0) return null

  return (
    <StatementList>
      {grouped.map(([day, dayRows]) => (
        <StatementGroup key={day} label={formatDate(day)}>
          {dayRows.map((tx) => {
            const category = tx.category_id
              ? categoryMap.get(tx.category_id)
              : undefined
            const account = accountMap.get(tx.account_id)
            const typeLabel =
              tx.type === 'transfer' ? t.types.transfer : t.types[tx.type]

            return (
              <StatementRow
                key={`${tx.context_id}-${tx.id}`}
                title={tx.description}
                ariaLabel={`${tx.description}, ${typeLabel}`}
                onClick={() => onSelect(tx)}
                meta={
                  <>
                    {category ? (
                      <CategoryChip
                        name={category.name}
                        colorIndex={category.colorIndex}
                      />
                    ) : null}
                    {account ? <span>{account.name}</span> : null}
                    {isConsolidated && tx.context ? (
                      <Badge tone="neutral">{tx.context.name}</Badge>
                    ) : null}
                    {tx.recurring_transaction_id ? (
                      <Badge tone="accent">{t.recurringBadge}</Badge>
                    ) : null}
                  </>
                }
                amount={
                  <MoneyValue
                    amount={tx.amount}
                    direction={transactionDirection(tx)}
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

/** Filtra no cliente (visão consolidada). */
export function applyClientFilters(
  rows: StatementEntry[],
  state: {
    from: string
    to: string
    accountId: string
    categoryId: string
    type: '' | 'income' | 'expense' | 'transfer'
    search: string
  },
): StatementEntry[] {
  return rows.filter((tx) => {
    if (state.from && tx.date < state.from) return false
    if (state.to && tx.date > state.to) return false
    if (state.accountId && tx.account_id !== state.accountId) return false
    if (state.categoryId && tx.category_id !== state.categoryId) return false
    if (state.type && tx.type !== state.type) return false
    if (state.search.trim()) {
      const needle = state.search.trim().toLowerCase()
      if (!tx.description.toLowerCase().includes(needle)) return false
    }
    return true
  })
}
