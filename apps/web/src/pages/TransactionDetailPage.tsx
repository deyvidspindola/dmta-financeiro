import { useMemo, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, FolderInput, Pencil, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { accountsApi, categoriesApi, goalsApi, transactionsApi } from '@/api'
import { MoveTransactionForm } from '@/components/transactions/MoveTransactionForm'
import { TransactionDetailBody } from '@/components/transactions/TransactionDetailModal'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import {
  ErrorBanner,
  IconButton,
  LoadingBlock,
  Modal,
  PageHeader,
  useConfirm,
} from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { getErrorMessage } from '@/lib/errors'
import { canMutateEntry } from '@/lib/transactionDisplay'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'
import { toastError, toastSuccess } from '@/store/toastStore'
import type { EntryFormValues } from '@/components/transactions/schemas'

const t = strings.transactionDetail
const tx = strings.transactions

/**
 * Deep-link / fallback de detalhe (`/transactions/:id`).
 * Na lista, o detalhe abre em modal (`TransactionDetailModal`).
 */
export function TransactionDetailPage() {
  const confirm = useConfirm()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const activeScope = useAuthStore((s) => s.activeScope)
  const contexts = useAuthStore((s) => s.contexts)

  const contextId =
    searchParams.get('context') ??
    (activeScope !== CONSOLIDATED ? activeScope : null)

  const [entryOpen, setEntryOpen] = useState(false)
  const [moving, setMoving] = useState(false)

  const txQuery = useQuery({
    queryKey: ['transaction', contextId, id],
    queryFn: () => transactionsApi.getTransaction(contextId!, id!),
    enabled: Boolean(contextId && id),
  })

  const transaction = txQuery.data

  const accountsQuery = useQuery({
    queryKey: ['accounts', contextId],
    queryFn: () => accountsApi.listAccounts(contextId!),
    enabled: Boolean(contextId),
  })

  const categoriesQuery = useQuery({
    queryKey: [
      'categories',
      contextId,
      transaction?.type === 'income' ? 'income' : 'expense',
    ],
    queryFn: () =>
      categoriesApi.listCategories(contextId!, {
        type: transaction?.type === 'income' ? 'income' : 'expense',
      }),
    enabled:
      Boolean(contextId) &&
      Boolean(transaction) &&
      transaction?.type !== 'transfer',
  })

  const goalsQuery = useQuery({
    queryKey: ['goals', contextId],
    queryFn: () => goalsApi.listGoals(contextId!),
    enabled: Boolean(contextId) && Boolean(transaction?.goal_id),
  })

  const accountName = useMemo(() => {
    if (!transaction) return '—'
    return (
      accountsQuery.data?.find((a) => a.id === transaction.account_id)?.name ??
      '—'
    )
  }, [transaction, accountsQuery.data])

  const category = useMemo(() => {
    if (!transaction?.category_id) return null
    const cat = categoriesQuery.data?.find(
      (c) => c.id === transaction.category_id,
    )
    if (!cat) return null
    return { name: cat.name, colorIndex: Number(cat.id) % 12 || 1 }
  }, [transaction, categoriesQuery.data])

  const goalName = useMemo(() => {
    if (!transaction?.goal_id) return null
    return (
      goalsQuery.data?.find((g) => g.id === transaction.goal_id)?.name ??
      transaction.goal_id
    )
  }, [transaction, goalsQuery.data])

  async function invalidateMoney() {
    await queryClient.invalidateQueries({ queryKey: ['transactions'] })
    await queryClient.invalidateQueries({ queryKey: ['transaction'] })
    await queryClient.invalidateQueries({ queryKey: ['accounts'] })
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    await queryClient.invalidateQueries({ queryKey: ['budgets'] })
  }

  const saveMutation = useMutation({
    mutationFn: (values: EntryFormValues) =>
      transactionsApi.updateTransaction(transaction!.context_id, transaction!.id, {
        account_id: values.account_id,
        category_id: values.category_id || null,
        description: values.description,
        amount: values.amount,
        type: values.type,
        date: values.date,
      }),
    onSuccess: async () => {
      await invalidateMoney()
      toastSuccess(tx.updated)
      setEntryOpen(false)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  const moveMutation = useMutation({
    mutationFn: (values: Parameters<typeof transactionsApi.moveTransaction>[2]) =>
      transactionsApi.moveTransaction(
        transaction!.context_id,
        transaction!.id,
        values,
      ),
    onSuccess: async (moved) => {
      await invalidateMoney()
      toastSuccess(tx.moved)
      setMoving(false)
      void navigate(`/transactions/${moved.id}?context=${moved.context_id}`, {
        replace: true,
      })
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  const settleMutation = useMutation({
    mutationFn: () =>
      transactionsApi.settleTransaction(
        transaction!.context_id,
        transaction!.id,
      ),
    onSuccess: async () => {
      await invalidateMoney()
      toastSuccess(t.settledToast)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: () =>
      transactionsApi.deleteTransaction(transaction!.context_id, transaction!.id),
    onSuccess: async () => {
      await invalidateMoney()
      toastSuccess(tx.deleted)
      void navigate('/transactions')
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  async function handleDelete() {
    if (
      !(await confirm({
        message: tx.confirmDelete,
        tone: 'danger',
      }))
    ) {
      return
    }
    deleteMutation.mutate()
  }

  if (!contextId) {
    return (
      <PageShell>
        <PageHeader title={t.title} />
        <ErrorBanner message={strings.common.consolidatedHint} />
        <BackLink />
      </PageShell>
    )
  }

  if (txQuery.isLoading) {
    return <LoadingBlock label={strings.common.loading} />
  }

  if (txQuery.isError || !transaction) {
    return (
      <PageShell>
        <PageHeader title={t.title} />
        <ErrorBanner
          message={
            txQuery.isError ? getErrorMessage(txQuery.error) : t.notFound
          }
        />
        <BackLink />
      </PageShell>
    )
  }

  const isConsolidated = activeScope === CONSOLIDATED
  const editable = !isConsolidated && canMutateEntry(transaction)

  return (
    <PageShell>
      <BackLink />

      <PageHeader
        title={transaction.description}
        actions={
          !isConsolidated ? (
            <>
              {editable ? (
                <IconButton
                  label={strings.common.edit}
                  icon={Pencil}
                  onClick={() => setEntryOpen(true)}
                />
              ) : null}
              {editable ? (
                <IconButton
                  label={tx.move}
                  icon={FolderInput}
                  onClick={() => setMoving(true)}
                />
              ) : null}
              <IconButton
                label={strings.common.delete}
                icon={Trash2}
                variant="danger"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              />
            </>
          ) : null
        }
      />

      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <TransactionDetailBody
          transaction={transaction}
          accountName={accountName}
          category={category}
          goalName={goalName}
          onSettle={
            !isConsolidated && transaction.status === 'pending'
              ? () => settleMutation.mutate()
              : undefined
          }
          settlePending={settleMutation.isPending}
        />
      </div>

      {entryOpen ? (
        <Modal title={tx.edit} size="xl" onClose={() => setEntryOpen(false)}>
          <TransactionForm
            key={transaction.id}
            contextId={transaction.context_id}
            initialValues={{
              description: transaction.description,
              amount: transaction.amount,
              date: transaction.date,
              type: (transaction.type === 'transfer'
                ? 'expense'
                : transaction.type) as 'income' | 'expense',
              account_id: transaction.account_id,
              category_id: transaction.category_id,
              goal_id: transaction.goal_id,
              settled: transaction.status === 'settled',
              is_recurring: false,
              interval: 'monthly',
              start_date: transaction.date,
              end_date: '',
            }}
            isEdit
            showRecurring={false}
            showGoal={false}
            isPending={saveMutation.isPending}
            error={
              saveMutation.isError ? getErrorMessage(saveMutation.error) : null
            }
            onSubmit={(values) => saveMutation.mutate(values)}
            onCancel={() => setEntryOpen(false)}
          />
        </Modal>
      ) : null}

      {moving ? (
        <Modal title={tx.moveTitle} onClose={() => setMoving(false)}>
          <MoveTransactionForm
            transaction={transaction}
            excludeContextId={transaction.context_id}
            contexts={contexts}
            isPending={moveMutation.isPending}
            error={
              moveMutation.isError ? getErrorMessage(moveMutation.error) : null
            }
            onSubmit={(values) => moveMutation.mutate(values)}
            onCancel={() => setMoving(false)}
          />
        </Modal>
      ) : null}
    </PageShell>
  )
}

function PageShell({ children }: { children: ReactNode }) {
  return <div className="space-y-6 bg-canvas text-fg">{children}</div>
}

function BackLink() {
  return (
    <Link
      to="/transactions"
      className="inline-flex items-center gap-1.5 text-sm text-fg-muted transition hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      <ArrowLeft size={16} aria-hidden />
      {t.back}
    </Link>
  )
}
