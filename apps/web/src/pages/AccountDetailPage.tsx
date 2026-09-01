import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  accountsApi,
  consolidatedApi,
  transactionsApi,
} from '@/api'
import { strings } from '@/i18n/pt-BR'
import { formatDate, formatMoney } from '@/lib/format'
import { getErrorMessage } from '@/lib/errors'
import {
  transactionBalanceEffect,
  transactionDirection,
} from '@/lib/transactionDisplay'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  MoneyValue,
  PageHeader,
  Panel,
} from '@/components/ui-legacy'

export function AccountDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const activeScope = useAuthStore((s) => s.activeScope)
  const isConsolidated = activeScope === CONSOLIDATED

  const contextId =
    searchParams.get('context') ??
    (activeScope !== CONSOLIDATED ? activeScope : null)

  const accountsQuery = useQuery({
    queryKey: ['accounts', activeScope],
    queryFn: () =>
      isConsolidated
        ? consolidatedApi.listConsolidatedAccounts()
        : accountsApi.listAccounts(activeScope),
    enabled: Boolean(activeScope),
  })

  const account = useMemo(() => {
    const rows = accountsQuery.data ?? []
    if (contextId) {
      return rows.find((a) => a.id === id && a.context_id === contextId)
    }
    return rows.find((a) => a.id === id)
  }, [accountsQuery.data, contextId, id])

  const txContextId = account?.context_id ?? contextId

  const transactionsQuery = useQuery({
    queryKey: ['transactions', txContextId],
    queryFn: () => transactionsApi.listTransactions(txContextId!),
    enabled: Boolean(txContextId && account),
  })

  const statement = useMemo(() => {
    if (!account) return []
    const rows = (transactionsQuery.data ?? []).filter(
      (tx) => tx.account_id === account.id,
    )
    const sorted = [...rows].sort(
      (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id),
    )
    let running = account.balance
    return sorted.map((tx) => {
      const row = { tx, runningBalance: running }
      running -= transactionBalanceEffect(tx)
      return row
    })
  }, [account, transactionsQuery.data])

  if (accountsQuery.isLoading) {
    return <LoadingBlock label={strings.common.loading} />
  }

  if (accountsQuery.isError) {
    return (
      <div className="stack">
        <PageHeader title={strings.accountDetail.title} />
        <ErrorBanner message={getErrorMessage(accountsQuery.error)} />
        <Link to="/accounts" className="back-link">
          <ArrowLeft size={16} aria-hidden /> {strings.accountDetail.back}
        </Link>
      </div>
    )
  }

  if (!account) {
    return (
      <div className="stack">
        <PageHeader title={strings.accountDetail.title} />
        <ErrorBanner message={strings.accountDetail.notFound} />
        <Link to="/accounts" className="back-link">
          <ArrowLeft size={16} aria-hidden /> {strings.accountDetail.back}
        </Link>
      </div>
    )
  }

  return (
    <div className="stack">
      <PageHeader title={account.name} description={strings.accountDetail.title} />

      <Link to="/accounts" className="back-link">
        <ArrowLeft size={16} aria-hidden /> {strings.accountDetail.back}
      </Link>

      <Panel>
        <div className="detail-grid">
          <div className="detail-field">
            <span className="detail-field__label muted">
              {strings.accounts.bankName}
            </span>
            <div className="detail-field__value">
              {account.bank_name ?? '—'}
            </div>
          </div>
          <div className="detail-field">
            <span className="detail-field__label muted">
              {strings.accounts.type}
            </span>
            <div className="detail-field__value">
              {strings.accounts.types[account.type]}
            </div>
          </div>
          <div className="detail-field">
            <span className="detail-field__label muted">
              {strings.accountDetail.currentBalance}
            </span>
            <div className="detail-field__value mono">
              {formatMoney(account.balance)}
            </div>
          </div>
        </div>
      </Panel>

      <Panel title={strings.accountDetail.statement}>
        {transactionsQuery.isLoading ? (
          <LoadingBlock label={strings.common.loading} />
        ) : null}
        {transactionsQuery.isError ? (
          <ErrorBanner message={getErrorMessage(transactionsQuery.error)} />
        ) : null}
        {statement.length === 0 ? (
          <EmptyState message={strings.accountDetail.emptyStatement} />
        ) : (
          <ul className="dash-list">
            {statement.map(({ tx, runningBalance }) => (
              <li key={tx.id}>
                <Link
                  to={`/transactions/${tx.id}?context=${tx.context_id}`}
                  className="dash-list__item"
                >
                  <span className="dash-list__main">
                    <strong>{tx.description}</strong>
                    <span className="muted small">{formatDate(tx.date)}</span>
                  </span>
                  <span className="dash-list__meta">
                    <MoneyValue
                      amount={tx.amount}
                      direction={transactionDirection(tx)}
                    />
                    <span className="muted small mono">
                      {formatMoney(runningBalance)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
