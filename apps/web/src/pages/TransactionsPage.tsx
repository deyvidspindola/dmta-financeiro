import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftRight, Plus } from 'lucide-react'
import {
  accountsApi,
  categoriesApi,
  consolidatedApi,
  recurringTransactionsApi,
  transactionsApi,
  transfersApi,
} from '@/api'
import type { TransactionListFilters } from '@/api/transactions'
import { MoveTransactionForm } from '@/components/transactions/MoveTransactionForm'
import { TransactionDetailModal } from '@/components/transactions/TransactionDetailModal'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import {
  applyClientFilters,
  TransactionList,
} from '@/components/transactions/TransactionList'
import {
  toApiFilters,
  TransactionFiltersBar,
  useTransactionFilters,
  countActiveFilters,
} from '@/components/transactions/TransactionFilters'
import { TransferForm } from '@/components/transactions/TransferForm'
import {
  emptyEntry,
  type EntryFormValues,
} from '@/components/transactions/schemas'
import {
  Button,
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  Modal,
  PageHeader,
} from '@/components/ui'
import { useWritableContextId } from '@/hooks/useWritableContextId'
import { strings } from '@/i18n/pt-BR'
import { getErrorMessage } from '@/lib/errors'
import { monthDateRange } from '@/lib/dates'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'
import { useMonthStore } from '@/store/monthStore'
import { toastError, toastSuccess } from '@/store/toastStore'
import type { StatementEntry } from '@/types/models'

const t = strings.transactions

export function TransactionsPage() {
  const queryClient = useQueryClient()
  const activeScope = useAuthStore((s) => s.activeScope)
  const contexts = useAuthStore((s) => s.contexts)
  const contextId = useWritableContextId()
  const month = useMonthStore((s) => s.month)
  const isConsolidated = activeScope === CONSOLIDATED

  const { state: filterState, debouncedSearch, patch, clear } =
    useTransactionFilters()

  const [entryOpen, setEntryOpen] = useState(false)
  const [editing, setEditing] = useState<StatementEntry | null>(null)
  const [transferOpen, setTransferOpen] = useState(false)
  const [moving, setMoving] = useState<StatementEntry | null>(null)
  const [detail, setDetail] = useState<StatementEntry | null>(null)

  const apiFilters = useMemo((): TransactionListFilters | undefined => {
    if (isConsolidated) return undefined
    return toApiFilters(filterState, debouncedSearch, month)
  }, [filterState, debouncedSearch, isConsolidated, month])

  const listQuery = useQuery({
    queryKey: ['transactions', activeScope, month, apiFilters],
    queryFn: () =>
      isConsolidated
        ? consolidatedApi.listConsolidatedTransactions()
        : transactionsApi.listTransactions(activeScope, apiFilters),
    enabled: isConsolidated || Boolean(activeScope),
  })

  const accountsQuery = useQuery({
    queryKey: ['accounts', activeScope],
    queryFn: () =>
      isConsolidated
        ? consolidatedApi.listConsolidatedAccounts()
        : accountsApi.listAccounts(activeScope),
    enabled: Boolean(activeScope),
  })

  const categoriesQuery = useQuery({
    queryKey: ['categories', contextId],
    queryFn: () => categoriesApi.listCategories(contextId!),
    enabled: Boolean(contextId) && !isConsolidated,
  })

  const data = useMemo(() => {
    const rows = listQuery.data ?? []
    if (!isConsolidated) return rows
    const { from, to } = monthDateRange(month)
    return applyClientFilters(rows, {
      ...filterState,
      search: debouncedSearch,
      from,
      to,
    })
  }, [listQuery.data, isConsolidated, filterState, debouncedSearch, month])

  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string; colorIndex: number }>()
    for (const cat of categoriesQuery.data ?? []) {
      map.set(cat.id, { name: cat.name, colorIndex: Number(cat.id) % 12 || 1 })
    }
    return map
  }, [categoriesQuery.data])

  const accountMap = useMemo(() => {
    const map = new Map<string, { name: string }>()
    for (const account of accountsQuery.data ?? []) {
      map.set(account.id, { name: account.name })
    }
    return map
  }, [accountsQuery.data])

  async function invalidateMoney() {
    await queryClient.invalidateQueries({ queryKey: ['transactions'] })
    await queryClient.invalidateQueries({ queryKey: ['accounts'] })
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const saveMutation = useMutation({
    mutationFn: async (values: EntryFormValues): Promise<void> => {
      const payload = {
        account_id: values.account_id,
        category_id: values.category_id || null,
        description: values.description,
        amount: values.amount,
        type: values.type,
        date: values.date,
        goal_id: values.goal_id || null,
        settled: values.settled,
      }
      if (editing) {
        await transactionsApi.updateTransaction(
          editing.context_id,
          editing.id,
          {
            account_id: payload.account_id,
            category_id: payload.category_id,
            description: payload.description,
            amount: payload.amount,
            type: payload.type,
            date: payload.date,
          },
        )
        return
      }
      if (values.is_recurring) {
        await recurringTransactionsApi.createRecurringTransaction(contextId!, {
          account_id: values.account_id,
          category_id: values.category_id || null,
          description: values.description,
          amount: values.amount,
          type: values.type,
          interval: values.interval,
          start_date: values.start_date || values.date,
          end_date: values.end_date || null,
        })
        return
      }
      await transactionsApi.createTransaction(contextId!, payload)
    },
    onSuccess: async (_data, values) => {
      await invalidateMoney()
      await queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] })
      await queryClient.invalidateQueries({ queryKey: ['goals'] })
      toastSuccess(
        editing
          ? t.updated
          : values.is_recurring
            ? t.recurringCreated
            : t.created,
      )
      setEntryOpen(false)
      setEditing(null)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  const transferMutation = useMutation({
    mutationFn: (values: Parameters<typeof transfersApi.createTransfer>[1]) =>
      transfersApi.createTransfer(contextId!, values),
    onSuccess: async () => {
      await invalidateMoney()
      toastSuccess(strings.transfers.created)
      setTransferOpen(false)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  const moveMutation = useMutation({
    mutationFn: (values: Parameters<typeof transactionsApi.moveTransaction>[2]) =>
      transactionsApi.moveTransaction(moving!.context_id, moving!.id, values),
    onSuccess: async () => {
      await invalidateMoney()
      toastSuccess(t.moved)
      setMoving(null)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  function openCreate() {
    setEditing(null)
    setEntryOpen(true)
  }

  const entryInitial = editing
    ? {
        description: editing.description,
        amount: editing.amount,
        date: editing.date,
        type: (editing.type === 'transfer' ? 'expense' : editing.type) as
          | 'income'
          | 'expense',
        account_id: editing.account_id,
        category_id: editing.category_id,
        goal_id: editing.goal_id,
        is_recurring: false,
        interval: 'monthly' as const,
        start_date: editing.date,
        end_date: '',
      }
    : emptyEntry()

  return (
    <div className="space-y-6 bg-canvas text-fg">
      <PageHeader
        title={t.title}
        description={
          isConsolidated ? strings.common.consolidatedHint : undefined
        }
        actions={
          !isConsolidated ? (
            <>
              <Button
                variant="ghost"
                onClick={() => setTransferOpen(true)}
                disabled={!contextId}
              >
                <ArrowLeftRight size={16} aria-hidden />
                {strings.transfers.create}
              </Button>
              <Button onClick={openCreate} disabled={!contextId}>
                <Plus size={16} aria-hidden />
                {t.create}
              </Button>
            </>
          ) : null
        }
      />

      <TransactionFiltersBar
        state={filterState}
        onChange={patch}
        onClear={clear}
        contextId={contextId}
        debouncedSearch={debouncedSearch}
      />

      {listQuery.isLoading ? (
        <LoadingBlock label={strings.common.loading} />
      ) : null}
      {listQuery.isError ? (
        <ErrorBanner message={getErrorMessage(listQuery.error)} />
      ) : null}

      {!listQuery.isLoading && data.length === 0 ? (
        <EmptyState
          message={
            countActiveFilters({ ...filterState, search: debouncedSearch })
              ? t.emptyMonth
              : t.empty
          }
        />
      ) : null}

      {!listQuery.isLoading && data.length > 0 ? (
        <TransactionList
          rows={data}
          categoryMap={categoryMap}
          accountMap={accountMap}
          isConsolidated={isConsolidated}
          onSelect={setDetail}
        />
      ) : null}

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

      {entryOpen && contextId ? (
        <Modal
          title={editing ? t.edit : t.create}
          size="xl"
          onClose={() => {
            setEntryOpen(false)
            setEditing(null)
          }}
        >
          <TransactionForm
            key={editing?.id ?? 'new'}
            contextId={contextId}
            initialValues={entryInitial}
            isEdit={Boolean(editing)}
            isPending={saveMutation.isPending}
            error={saveMutation.isError ? getErrorMessage(saveMutation.error) : null}
            onSubmit={(values) => saveMutation.mutate(values)}
            onCancel={() => {
              setEntryOpen(false)
              setEditing(null)
            }}
          />
        </Modal>
      ) : null}

      {transferOpen && contextId ? (
        <Modal
          title={strings.transfers.create}
          onClose={() => setTransferOpen(false)}
        >
          <TransferForm
            contextId={contextId}
            contexts={contexts}
            isPending={transferMutation.isPending}
            error={
              transferMutation.isError
                ? getErrorMessage(transferMutation.error)
                : null
            }
            onSubmit={(values) => transferMutation.mutate(values)}
            onCancel={() => setTransferOpen(false)}
          />
        </Modal>
      ) : null}

      {moving ? (
        <Modal title={t.moveTitle} onClose={() => setMoving(null)}>
          <MoveTransactionForm
            transaction={moving}
            excludeContextId={moving.context_id}
            contexts={contexts}
            isPending={moveMutation.isPending}
            error={
              moveMutation.isError ? getErrorMessage(moveMutation.error) : null
            }
            onSubmit={(values) => moveMutation.mutate(values)}
            onCancel={() => setMoving(null)}
          />
        </Modal>
      ) : null}
    </div>
  )
}
