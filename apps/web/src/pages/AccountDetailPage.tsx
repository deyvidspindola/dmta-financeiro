import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Pencil } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { accountsApi, consolidatedApi, transactionsApi } from '@/api'
import { AccountForm } from '@/components/accounts/AccountForm'
import { AccountStatement } from '@/components/accounts/AccountStatement'
import type { AccountFormValues } from '@/components/accounts/schemas'
import { TransactionDetailModal } from '@/components/transactions/TransactionDetailModal'
import {
  Badge,
  Button,
  ErrorBanner,
  LoadingBlock,
  Modal,
  Money,
  Panel,
} from '@/components/ui'
import { useWritableContextId } from '@/hooks/useWritableContextId'
import { strings } from '@/i18n/pt-BR'
import { getErrorMessage } from '@/lib/errors'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'
import { toastError, toastSuccess } from '@/store/toastStore'
import type { StatementEntry } from '@/types/models'

const t = strings.accountDetail
const ta = strings.accounts

export function AccountDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const activeScope = useAuthStore((s) => s.activeScope)
  const contextId = useWritableContextId()
  const isConsolidated = activeScope === CONSOLIDATED
  const [editOpen, setEditOpen] = useState(false)
  const [detail, setDetail] = useState<StatementEntry | null>(null)

  const urlContextId =
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
    if (urlContextId) {
      return rows.find((a) => a.id === id && a.context_id === urlContextId)
    }
    return rows.find((a) => a.id === id)
  }, [accountsQuery.data, urlContextId, id])

  const txContextId = account?.context_id ?? urlContextId

  const transactionsQuery = useQuery({
    queryKey: ['transactions', txContextId, id],
    queryFn: () =>
      transactionsApi.listTransactions(txContextId!, { account_id: id }),
    enabled: Boolean(txContextId && account && id),
  })

  const mutation = useMutation({
    mutationFn: (values: AccountFormValues) =>
      accountsApi.updateAccount(contextId!, account!.id, {
        name: values.name,
        bank_name: values.bank_name || null,
        type: values.type,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['accounts'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toastSuccess(ta.updated)
      setEditOpen(false)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  if (accountsQuery.isLoading) {
    return <LoadingBlock label={strings.common.loading} />
  }

  if (accountsQuery.isError) {
    return (
      <div className="space-y-4 bg-canvas text-fg">
        <ErrorBanner message={getErrorMessage(accountsQuery.error)} />
        <Link
          to="/accounts"
          className="inline-flex items-center gap-1.5 text-sm text-fg-muted transition hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          <ArrowLeft size={16} aria-hidden />
          {t.back}
        </Link>
      </div>
    )
  }

  if (!account) {
    return (
      <div className="space-y-4 bg-canvas text-fg">
        <ErrorBanner message={t.notFound} />
        <Link
          to="/accounts"
          className="inline-flex items-center gap-1.5 text-sm text-fg-muted transition hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          <ArrowLeft size={16} aria-hidden />
          {t.back}
        </Link>
      </div>
    )
  }

  const subtitle = [
    account.bank_name,
    ta.types[account.type],
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="space-y-6 bg-canvas text-fg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/accounts"
          className="inline-flex items-center gap-1.5 text-sm text-fg-muted transition hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          <ArrowLeft size={16} aria-hidden />
          {t.back}
        </Link>
        <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5 px-2 text-center">
          <h1 className="truncate font-display text-lg font-bold sm:text-xl">
            {account.name}
          </h1>
          {subtitle ? (
            <p className="truncate text-sm text-fg-muted">{subtitle}</p>
          ) : null}
        </div>
        {!isConsolidated && contextId ? (
          <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil size={16} />
            <span className="hidden sm:inline">{strings.common.edit}</span>
          </Button>
        ) : (
          <div className="w-10" aria-hidden />
        )}
      </div>

      <div className="flex flex-col items-center gap-1 border-y border-line py-6">
        <span className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
          {t.currentBalance}
        </span>
        <Money amount={account.balance} size="xl" />
        {isConsolidated && account.context ? (
          <Badge tone="accent" className="mt-2">
            {account.context.name}
          </Badge>
        ) : null}
      </div>

      <Panel title={t.statement}>
        {transactionsQuery.isLoading ? (
          <LoadingBlock label={strings.common.loading} />
        ) : null}
        {transactionsQuery.isError ? (
          <ErrorBanner message={getErrorMessage(transactionsQuery.error)} />
        ) : null}
        {!transactionsQuery.isLoading && !transactionsQuery.isError ? (
          <AccountStatement
            account={account}
            transactions={transactionsQuery.data ?? []}
            onSelect={setDetail}
          />
        ) : null}
      </Panel>

      {detail ? (
        <TransactionDetailModal
          key={`${detail.context_id}-${detail.id}`}
          transactionId={detail.id}
          contextId={detail.context_id}
          onClose={() => setDetail(null)}
          onDeleted={() => setDetail(null)}
          onMoved={(moved) => setDetail(moved)}
        />
      ) : null}

      {editOpen && contextId ? (
        <Modal title={ta.edit} onClose={() => setEditOpen(false)}>
          <AccountForm
            isEdit
            initialValues={{
              name: account.name,
              bank_name: account.bank_name ?? '',
              type: account.type,
              balance: account.balance,
            }}
            isPending={mutation.isPending}
            error={mutation.isError ? getErrorMessage(mutation.error) : null}
            onSubmit={(values) => mutation.mutate(values)}
            onCancel={() => setEditOpen(false)}
          />
        </Modal>
      ) : null}
    </div>
  )
}
