import { useMemo, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FolderInput, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { accountsApi, categoriesApi, goalsApi, transactionsApi } from '@/api'
import { MoveTransactionForm } from '@/components/transactions/MoveTransactionForm'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { TransactionOriginBadge } from '@/components/transactions/TransactionOriginBadge'
import {
  Badge,
  Button,
  CategoryChip,
  ErrorBanner,
  IconButton,
  LoadingBlock,
  Modal,
  MoneyValue,
  useConfirm,
} from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { formatDate } from '@/lib/format'
import { getErrorMessage } from '@/lib/errors'
import {
  canMutateEntry,
  transactionDirection,
} from '@/lib/transactionDisplay'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'
import { toastError, toastSuccess } from '@/store/toastStore'
import type { EntryFormValues } from '@/components/transactions/schemas'
import type { StatementEntry } from '@/types/models'

const t = strings.transactionDetail
const tx = strings.transactions

type TransactionDetailModalProps = {
  transactionId: string
  contextId: string
  onClose: () => void
  /** Após excluir (lista deve limpar seleção). */
  onDeleted?: () => void
  /** Após mover — id/contexto novos. */
  onMoved?: (moved: StatementEntry) => void
}

/**
 * Detalhe do lançamento em modal — editar / mover / excluir / efetivar.
 * A rota `/transactions/:id` continua como deep-link.
 */
export function TransactionDetailModal({
  transactionId,
  contextId,
  onClose,
  onDeleted,
  onMoved,
}: TransactionDetailModalProps) {
  const confirm = useConfirm()
  const queryClient = useQueryClient()
  const activeScope = useAuthStore((s) => s.activeScope)
  const contexts = useAuthStore((s) => s.contexts)

  const [entryOpen, setEntryOpen] = useState(false)
  const [moving, setMoving] = useState(false)

  const txQuery = useQuery({
    queryKey: ['transaction', contextId, transactionId],
    queryFn: () => transactionsApi.getTransaction(contextId, transactionId),
    enabled: Boolean(contextId && transactionId),
  })

  const transaction = txQuery.data

  const accountsQuery = useQuery({
    queryKey: ['accounts', contextId],
    queryFn: () => accountsApi.listAccounts(contextId),
    enabled: Boolean(contextId),
  })

  const categoriesQuery = useQuery({
    queryKey: [
      'categories',
      contextId,
      transaction?.type === 'income' ? 'income' : 'expense',
    ],
    queryFn: () =>
      categoriesApi.listCategories(contextId, {
        type: transaction?.type === 'income' ? 'income' : 'expense',
      }),
    enabled:
      Boolean(contextId) &&
      Boolean(transaction) &&
      transaction?.type !== 'transfer',
  })

  const goalsQuery = useQuery({
    queryKey: ['goals', contextId],
    queryFn: () => goalsApi.listGoals(contextId),
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
      onMoved?.(moved)
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
      onDeleted?.()
      onClose()
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

  const title = transaction?.description ?? t.title
  const isConsolidated = activeScope === CONSOLIDATED
  const editable =
    Boolean(transaction) && !isConsolidated && canMutateEntry(transaction!)

  return (
    <>
      <Modal
        title={title}
        size="lg"
        onClose={onClose}
        footer={
          transaction && !isConsolidated ? (
            <div className="flex w-full flex-wrap items-center justify-end gap-1">
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
            </div>
          ) : undefined
        }
      >
        {txQuery.isLoading ? (
          <LoadingBlock label={strings.common.loading} />
        ) : null}
        {txQuery.isError || (!txQuery.isLoading && !transaction) ? (
          <ErrorBanner
            message={
              txQuery.isError ? getErrorMessage(txQuery.error) : t.notFound
            }
          />
        ) : null}
        {transaction ? (
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
        ) : null}
      </Modal>

      {entryOpen && transaction ? (
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

      {moving && transaction ? (
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
    </>
  )
}

type DetailBodyProps = {
  transaction: StatementEntry
  accountName: string
  category: { name: string; colorIndex: number } | null
  goalName: string | null
  onSettle?: () => void
  settlePending?: boolean
}

export function TransactionDetailBody({
  transaction,
  accountName,
  category,
  goalName,
  onSettle,
  settlePending = false,
}: DetailBodyProps) {
  const typeLabel =
    transaction.type === 'transfer'
      ? tx.types.transfer
      : tx.types[transaction.type]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <MoneyValue
          amount={transaction.amount}
          direction={transactionDirection(transaction)}
          size="lg"
        />
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <Badge tone="neutral">{typeLabel}</Badge>
          {transaction.status === 'pending' ? (
            <Badge tone="warning">{tx.pendingBadge}</Badge>
          ) : null}
          <TransactionOriginBadge origin={transaction.origin} />
        </div>
        {transaction.status === 'settled' && transaction.settled_at ? (
          <p className="mt-2 text-sm text-fg-muted">
            {t.settledAt(formatDate(transaction.settled_at))}
          </p>
        ) : null}
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <DetailItem label={tx.date}>{formatDate(transaction.date)}</DetailItem>
        <DetailItem label={tx.account}>
          <Link
            to={`/accounts/${transaction.account_id}?context=${transaction.context_id}`}
            className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            {accountName}
          </Link>
        </DetailItem>
        <DetailItem label={tx.category}>
          {category ? (
            <CategoryChip
              name={category.name}
              colorIndex={category.colorIndex}
            />
          ) : (
            '—'
          )}
        </DetailItem>
        {transaction.bill_id ? (
          <DetailItem label={t.linkedBill}>
            <Link
              to="/bills"
              className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              {t.viewBill}
            </Link>
            <span className="ml-1 text-xs text-fg-subtle">
              #{transaction.bill_id}
            </span>
          </DetailItem>
        ) : null}
        {goalName ? (
          <DetailItem label={t.linkedGoal}>
            <Link
              to="/goals"
              className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              {goalName}
            </Link>
          </DetailItem>
        ) : null}
        {transaction.card_invoice_id ? (
          <DetailItem label={t.linkedInvoice}>
            <Link
              to="/credit-cards"
              className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              {t.viewInvoice}
            </Link>
            <span className="ml-1 text-xs text-fg-subtle">
              #{transaction.card_invoice_id}
            </span>
          </DetailItem>
        ) : null}
      </dl>

      {onSettle ? (
        <Button
          type="button"
          onClick={onSettle}
          loading={settlePending}
          disabled={settlePending}
          block
        >
          {t.settle}
        </Button>
      ) : null}

      {transaction.transfer ? (
        <div className="rounded-xl border border-line bg-surface-2 p-4">
          <h3 className="mb-3 text-sm font-semibold text-fg">
            {t.transferSection}
          </h3>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-fg-muted">{t.transferFrom}: </span>
              {transaction.transfer.from.context.name} →{' '}
              {transaction.transfer.from.account.name}
            </p>
            <p>
              <span className="text-fg-muted">{t.transferTo}: </span>
              {transaction.transfer.to.context.name} →{' '}
              {transaction.transfer.to.account.name}
            </p>
          </div>
        </div>
      ) : null}
    </div>
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
