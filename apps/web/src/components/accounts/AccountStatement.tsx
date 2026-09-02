import { useMemo } from 'react'
import { DashboardListItem } from '@/components/dashboard/DashboardListItem'
import { EmptyState, Money, MoneyValue } from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { formatDate } from '@/lib/format'
import {
  transactionBalanceEffect,
  transactionDirection,
} from '@/lib/transactionDisplay'
import type { Account, StatementEntry } from '@/types/models'

const t = strings.accountDetail

type StatementRow = { tx: StatementEntry; runningBalance: number }

function buildStatement(
  account: Account,
  transactions: StatementEntry[],
): StatementRow[] {
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

function groupByDay(rows: StatementRow[]): [string, StatementRow[]][] {
  const map = new Map<string, StatementRow[]>()
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
}

export function AccountStatement({ account, transactions }: AccountStatementProps) {
  const statement = useMemo(
    () => buildStatement(account, transactions),
    [account, transactions],
  )
  const grouped = useMemo(() => groupByDay(statement), [statement])

  if (statement.length === 0) {
    return <EmptyState message={t.emptyStatement} />
  }

  return (
    <div className="space-y-4">
      {grouped.map(([day, dayRows]) => (
        <section key={day}>
          <h2 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
            {formatDate(day)}
          </h2>
          <ul className="-mx-2 divide-y divide-line rounded-2xl border border-line bg-surface">
            {dayRows.map(({ tx, runningBalance }) => (
              <li key={tx.id}>
                <DashboardListItem
                  to={`/transactions/${tx.id}?context=${tx.context_id}`}
                  ariaLabel={tx.description}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-fg">
                        {tx.description}
                      </p>
                      <p className="mt-0.5 text-xs text-fg-muted">
                        {t.runningBalance}{' '}
                        <Money amount={runningBalance} size="sm" />
                      </p>
                    </div>
                    <MoneyValue
                      amount={tx.amount}
                      direction={transactionDirection(tx)}
                      size="sm"
                    />
                  </div>
                </DashboardListItem>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
