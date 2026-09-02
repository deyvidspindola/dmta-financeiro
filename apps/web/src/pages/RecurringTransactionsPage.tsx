import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { accountsApi, categoriesApi, recurringTransactionsApi } from '@/api'
import { CategoryModal } from '@/components/CategoryModal'
import { RecurringForm } from '@/components/recurring/RecurringForm'
import { RecurringList } from '@/components/recurring/RecurringList'
import type { RecurringFormValues } from '@/components/recurring/schemas'
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
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'
import { toastError, toastSuccess } from '@/store/toastStore'

const r = strings.recurring

export function RecurringTransactionsPage() {
  const queryClient = useQueryClient()
  const activeScope = useAuthStore((s) => s.activeScope)
  const contextId = useWritableContextId()
  const listContextId = activeScope === CONSOLIDATED ? null : activeScope
  const [open, setOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [formType, setFormType] = useState<'income' | 'expense'>('expense')

  const listQuery = useQuery({
    queryKey: ['recurring-transactions', listContextId],
    queryFn: () =>
      recurringTransactionsApi.listRecurringTransactions(listContextId!),
    enabled: Boolean(listContextId),
  })

  const accountsQuery = useQuery({
    queryKey: ['accounts', listContextId],
    queryFn: () => accountsApi.listAccounts(listContextId!),
    enabled: Boolean(listContextId),
  })

  const categoriesQuery = useQuery({
    queryKey: ['categories', listContextId],
    queryFn: () => categoriesApi.listCategories(listContextId!),
    enabled: Boolean(listContextId),
  })

  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string; colorIndex: number }>()
    for (const cat of categoriesQuery.data ?? []) {
      map.set(cat.id, {
        name: cat.name,
        colorIndex: Number(cat.id) % 12 || 1,
      })
    }
    return map
  }, [categoriesQuery.data])

  const accountMap = useMemo(() => {
    const map = new Map<string, { name: string }>()
    for (const acc of accountsQuery.data ?? []) {
      map.set(acc.id, { name: acc.name })
    }
    return map
  }, [accountsQuery.data])

  const createMutation = useMutation({
    mutationFn: (values: RecurringFormValues) =>
      recurringTransactionsApi.createRecurringTransaction(contextId!, {
        account_id: values.account_id,
        description: values.description,
        amount: values.amount,
        type: values.type,
        interval: values.interval,
        start_date: values.start_date,
        end_date: values.no_end ? null : values.end_date || null,
        category_id: values.category_id || null,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['recurring-transactions'],
      })
      toastSuccess(r.created)
      setOpen(false)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (recurringId: string) =>
      recurringTransactionsApi.deleteRecurringTransaction(
        contextId!,
        recurringId,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['recurring-transactions'],
      })
      toastSuccess(r.cancelled)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  function handleCancel(recurringId: string) {
    if (!window.confirm(r.confirmCancel)) return
    deleteMutation.mutate(recurringId)
  }

  const canMutate = Boolean(contextId) && activeScope !== CONSOLIDATED
  const data = listQuery.data ?? []
  const formCategories = (categoriesQuery.data ?? []).filter(
    (cat) => cat.type === formType,
  )

  return (
    <div className="space-y-6 bg-canvas text-fg">
      <PageHeader
        title={r.title}
        description={r.hint}
        actions={
          <Button onClick={() => setOpen(true)} disabled={!canMutate}>
            <Plus size={16} aria-hidden />
            {r.create}
          </Button>
        }
      />

      {activeScope === CONSOLIDATED ? (
        <ErrorBanner message={r.needContext} />
      ) : null}

      {listQuery.isLoading ? (
        <LoadingBlock label={strings.common.loading} />
      ) : null}
      {listQuery.isError ? (
        <ErrorBanner message={getErrorMessage(listQuery.error)} />
      ) : null}

      {!listQuery.isLoading && listContextId && data.length === 0 ? (
        <EmptyState message={r.empty} />
      ) : null}

      <RecurringList
        rows={data}
        categoryMap={categoryMap}
        accountMap={accountMap}
        canMutate={canMutate}
        onCancel={handleCancel}
        cancelPending={deleteMutation.isPending}
      />

      {open && contextId ? (
        <Modal title={r.create} onClose={() => setOpen(false)}>
          <RecurringForm
            accounts={accountsQuery.data ?? []}
            categories={formCategories}
            isPending={createMutation.isPending}
            error={
              createMutation.isError
                ? getErrorMessage(createMutation.error)
                : null
            }
            onSubmit={(values) => {
              setFormType(values.type)
              createMutation.mutate(values)
            }}
            onCancel={() => setOpen(false)}
            onQuickAddCategory={() => setCategoryOpen(true)}
          />
        </Modal>
      ) : null}

      {contextId ? (
        <CategoryModal
          contextId={contextId}
          open={categoryOpen}
          onClose={() => setCategoryOpen(false)}
          defaultType={formType}
        />
      ) : null}
    </div>
  )
}
