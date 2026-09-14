import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { accountsApi, categoriesApi, goalsApi, transactionsApi } from '@/api'
import { strings } from '@/i18n/pt-BR'
import { getErrorMessage } from '@/lib/errors'
import { canMutateEntry } from '@/lib/transactionDisplay'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'
import { toastError, toastSuccess } from '@/store/toastStore'
import { useConfirm } from '@/components/ui'
import type { EntryFormValues } from '@/components/transactions/schemas'
import type { StatementEntry } from '@/types/models'

const t = strings.transactionDetail
const tx = strings.transactions

type Options = {
  contextId: string | null
  transactionId: string | undefined
  /** Chamado depois que o delete dá certo (toast + invalidate já rodaram). */
  onDeleted?: () => void
  /** Chamado depois que o move dá certo, com o lançamento no contexto novo. */
  onMoved?: (moved: StatementEntry) => void
}

/**
 * Toda a lógica de ver/editar/mover/efetivar/excluir 1 lançamento —
 * queries, mutations, campos derivados (nome da conta/categoria/meta).
 * Compartilhado entre `TransactionDetailModal` (lista) e
 * `TransactionDetailPage` (`/transactions/:id`, deep-link) — as duas
 * telas tinham a mesma lógica copiada duas vezes, só a casca (modal ×
 * página cheia) e o que acontece depois de excluir/mover é diferente,
 * e isso fica a cargo de quem chama via `onDeleted`/`onMoved`.
 */
export function useTransactionDetail({ contextId, transactionId, onDeleted, onMoved }: Options) {
  const confirm = useConfirm()
  const queryClient = useQueryClient()
  const activeScope = useAuthStore((s) => s.activeScope)
  const contexts = useAuthStore((s) => s.contexts)

  const [entryOpen, setEntryOpen] = useState(false)
  const [moving, setMoving] = useState(false)

  const txQuery = useQuery({
    queryKey: ['transaction', contextId, transactionId],
    queryFn: () => transactionsApi.getTransaction(contextId!, transactionId!),
    enabled: Boolean(contextId && transactionId),
  })

  const transaction = txQuery.data

  const accountsQuery = useQuery({
    queryKey: ['accounts', contextId],
    queryFn: () => accountsApi.listAccounts(contextId!),
    enabled: Boolean(contextId),
  })

  const categoriesQuery = useQuery({
    queryKey: ['categories', contextId, transaction?.type === 'income' ? 'income' : 'expense'],
    queryFn: () =>
      categoriesApi.listCategories(contextId!, {
        type: transaction?.type === 'income' ? 'income' : 'expense',
      }),
    enabled: Boolean(contextId) && Boolean(transaction) && transaction?.type !== 'transfer',
  })

  const goalsQuery = useQuery({
    queryKey: ['goals', contextId],
    queryFn: () => goalsApi.listGoals(contextId!),
    enabled: Boolean(contextId) && Boolean(transaction?.goal_id),
  })

  const accountName = useMemo(() => {
    if (!transaction) return '—'
    return accountsQuery.data?.find((a) => a.id === transaction.account_id)?.name ?? '—'
  }, [transaction, accountsQuery.data])

  const category = useMemo(() => {
    if (!transaction?.category_id) return null
    const cat = categoriesQuery.data?.find((c) => c.id === transaction.category_id)
    if (!cat) return null
    return { name: cat.name, colorIndex: Number(cat.id) % 12 || 1 }
  }, [transaction, categoriesQuery.data])

  const goalName = useMemo(() => {
    if (!transaction?.goal_id) return null
    return goalsQuery.data?.find((g) => g.id === transaction.goal_id)?.name ?? transaction.goal_id
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
      transactionsApi.moveTransaction(transaction!.context_id, transaction!.id, values),
    onSuccess: async (moved) => {
      await invalidateMoney()
      toastSuccess(tx.moved)
      setMoving(false)
      onMoved?.(moved)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  const settleMutation = useMutation({
    mutationFn: () => transactionsApi.settleTransaction(transaction!.context_id, transaction!.id),
    onSuccess: async () => {
      await invalidateMoney()
      toastSuccess(t.settledToast)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: () => transactionsApi.deleteTransaction(transaction!.context_id, transaction!.id),
    onSuccess: async () => {
      await invalidateMoney()
      toastSuccess(tx.deleted)
      onDeleted?.()
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  async function handleDelete() {
    if (!(await confirm({ message: tx.confirmDelete, tone: 'danger' }))) {
      return
    }
    deleteMutation.mutate()
  }

  const isConsolidated = activeScope === CONSOLIDATED
  const editable = Boolean(transaction) && !isConsolidated && canMutateEntry(transaction!)

  return {
    transaction,
    isLoading: txQuery.isLoading,
    isError: txQuery.isError,
    error: txQuery.error,
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
  }
}
