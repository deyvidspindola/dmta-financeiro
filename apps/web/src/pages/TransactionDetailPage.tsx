import type { ReactNode } from 'react'
import { ArrowLeft, FolderInput, Pencil, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { MoveTransactionForm } from '@/components/transactions/MoveTransactionForm'
import { TransactionDetailBody } from '@/components/transactions/TransactionDetailModal'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { useTransactionDetail } from '@/components/transactions/useTransactionDetail'
import { ErrorBanner, IconButton, LoadingBlock, Modal, PageHeader } from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { getErrorMessage } from '@/lib/errors'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'

const t = strings.transactionDetail
const tx = strings.transactions

/**
 * Deep-link / fallback de detalhe (`/transactions/:id`).
 * Na lista, o detalhe abre em modal (`TransactionDetailModal`) — mesma
 * lógica via `useTransactionDetail`, só a casca muda (página cheia em
 * vez de modal, e excluir/mover navegam em vez de fechar/notificar).
 */
export function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const activeScope = useAuthStore((s) => s.activeScope)

  const contextId =
    searchParams.get('context') ?? (activeScope !== CONSOLIDATED ? activeScope : null)

  const {
    transaction,
    isLoading,
    isError,
    error,
    accountName,
    category,
    goalName,
    contexts,
    isConsolidated,
    editable,
    entryOpen,
    setEntryOpen,
    moving,
    setMoving,
    saveMutation,
    moveMutation,
    settleMutation,
    deleteMutation,
    handleDelete,
  } = useTransactionDetail({
    contextId,
    transactionId: id,
    onDeleted: () => navigate('/transactions'),
    onMoved: (moved) => navigate(`/transactions/${moved.id}?context=${moved.context_id}`, { replace: true }),
  })

  if (!contextId) {
    return (
      <PageShell>
        <PageHeader title={t.title} />
        <ErrorBanner message={strings.common.consolidatedHint} />
        <BackLink />
      </PageShell>
    )
  }

  if (isLoading) {
    return <LoadingBlock label={strings.common.loading} />
  }

  if (isError || !transaction) {
    return (
      <PageShell>
        <PageHeader title={t.title} />
        <ErrorBanner message={isError ? getErrorMessage(error) : t.notFound} />
        <BackLink />
      </PageShell>
    )
  }

  return (
    <PageShell>
      <BackLink />

      <PageHeader
        title={transaction.description}
        actions={
          !isConsolidated ? (
            <>
              {editable ? (
                <IconButton label={strings.common.edit} icon={Pencil} onClick={() => setEntryOpen(true)} />
              ) : null}
              {editable ? (
                <IconButton label={tx.move} icon={FolderInput} onClick={() => setMoving(true)} />
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
            error={saveMutation.isError ? getErrorMessage(saveMutation.error) : null}
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
            error={moveMutation.isError ? getErrorMessage(moveMutation.error) : null}
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
