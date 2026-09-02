import { useMemo } from 'react'
import { Badge, EmptyState, Money, MoneyValue, StatementGroup, StatementList, StatementRow } from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { formatDate } from '@/lib/format'
import {
  transactionBalanceEffect,
  transactionDirection,
} from '@/lib/transactionDisplay'
import type { Account, StatementEntry } from '@/types/models'

const t = strings.accountDetail

type StatementLine = { tx: StatementEntry; runningBalance: number }

function buildStatement(
  account: Account,
  transactions: StatementEntry[],
): StatementLine[] {
  const sorted = [...transactions].sort(
    (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id),
  )
  let running = account.balance
  return sorted.map((tx) => {
    const row = { tx, runningBalance: running }
    running -= transactionBalanceEffect(tx)
    return row
  })
}

function groupByDay(rows: StatementLine[]): [string, StatementLine[]][] {
  const map = new Map<string, StatementLine[]>()
  for (const row of rows) {
    const day = row.tx.date
    const list = map.get(day) ?? []
    list.push(row)
    map.set(day, list)
  }
  return [...map.entries()].sort(([a], [b]) => b.localeCompare(a))
}

type AccountStatementProps = {
  account: Account
  transactions: StatementEntry[]
  onSelect: (tx: StatementEntry) => void
}

export function AccountStatement({
  account,
  transactions,
  onSelect,
}: AccountStatementProps) {
  const statement = useMemo(
    () => buildStatement(account, transactions),
    [account, transactions],
  )
  const grouped = useMemo(() => groupByDay(statement), [statement])

  if (statement.length === 0) {
    return <EmptyState message={t.emptyStatement} />
  }

  return (
    <StatementList>
      {grouped.map(([day, dayRows]) => (
        <StatementGroup key={day} label={formatDate(day)}>
          {dayRows.map(({ tx, runningBalance }) => (
            <StatementRow
              key={tx.id}
              title={tx.description}
              ariaLabel={tx.description}
              onClick={() => onSelect(tx)}
              className={tx.status === 'pending' ? 'opacity-70' : undefined}
              meta={
                <span className="inline-flex flex-wrap items-center gap-2">
                  <span>
                    {t.runningBalance}{' '}
                    <Money amount={runningBalance} size="sm" />
                  </span>
                  {tx.status === 'pending' ? (
                    <Badge tone="warning">
                      {strings.transactions.pendingBadge}
                    </Badge>
                  ) : null}
                </span>
              }
              amount={
                <MoneyValue
                  amount={tx.amount}
                  direction={transactionDirection(tx)}
                  size="sm"
                />
              }
            />
          ))}
        </StatementGroup>
      ))}
    </StatementList>
  )
}
