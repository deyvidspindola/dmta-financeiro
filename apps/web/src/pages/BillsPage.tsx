import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { billsApi, accountsApi, categoriesApi, consolidatedApi } from '@/api'
import { CategoryModal } from '@/components/CategoryModal'
import { BillFiltersBar } from '@/components/bills/BillFilters'
import { applyClientBillFilters, toApiBillFilters } from '@/components/bills/billFilterState'
import { useBillFilters } from '@/components/bills/useBillFilters'
import { BillForm } from '@/components/bills/BillForm'
import { BillList } from '@/components/bills/BillList'
import { PayBillForm } from '@/components/bills/PayBillForm'
import { categoryTypeForBillKind } from '@/components/bills/billDisplay'
import { summarizeBills } from '@/components/bills/billSummary'
import type { BillFormValues } from '@/components/bills/schemas'
import {
  Button,
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  Modal,
  Money,
  PageHeader,
  Stat,
  useConfirm,
} from '@/components/ui'
import { useWritableContextId } from '@/hooks/useWritableContextId'
import { strings } from '@/i18n/pt-BR'
import { getErrorMessage } from '@/lib/errors'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'
import { useMonthStore } from '@/store/monthStore'
import { toastError, toastSuccess } from '@/store/toastStore'
import type { Bill } from '@/types/models'

const b = strings.bills

export function BillsPage() {
  const confirm = useConfirm()
  const queryClient = useQueryClient()
  const activeScope = useAuthStore((s) => s.activeScope)
  const contextId = useWritableContextId()
  const month = useMonthStore((s) => s.month)
  const isConsolidated = activeScope === CONSOLIDATED

  const { state: filterState, debouncedSearch, patch, clear } = useBillFilters()

  const [editing, setEditing] = useState<Bill | null>(null)
  const [open, setOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [paying, setPaying] = useState<Bill | null>(null)
  const [formCategoryType, setFormCategoryType] = useState<'income' | 'expense'>('expense')

  const apiFilters = useMemo(() => {
    if (isConsolidated) return undefined
    return toApiBillFilters(filterState, debouncedSearch, month)
  }, [filterState, debouncedSearch, isConsolidated, month])

  const listQuery = useQuery({
    queryKey: ['bills', activeScope, month, apiFilters],
    queryFn: () =>
      isConsolidated
        ? consolidatedApi.listConsolidatedBills()
        : billsApi.listBills(activeScope, apiFilters),
    enabled: isConsolidated || Boolean(activeScope),
  })

  const data = useMemo(() => {
    const rows = listQuery.data ?? []
    if (!isConsolidated) return rows
    return applyClientBillFilters(rows, filterState, debouncedSearch, month)
  }, [listQuery.data, isConsolidated, filterState, debouncedSearch, month])

  const categoriesQuery = useQuery({
    queryKey: ['categories', contextId],
    queryFn: () => categoriesApi.listCategories(contextId!),
    enabled: Boolean(contextId),
  })

  const formCategoriesQuery = useQuery({
    queryKey: ['categories', contextId, formCategoryType],
    queryFn: () =>
      categoriesApi.listCategories(contextId!, { type: formCategoryType }),
    enabled: Boolean(contextId) && open,
  })

  const payAccountsQuery = useQuery({
    queryKey: ['accounts', contextId],
    queryFn: () => accountsApi.listAccounts(contextId!),
    enabled: Boolean(contextId) && Boolean(paying),
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

  const summary = useMemo(() => summarizeBills(data), [data])
  const hasSummary =
    summary.payablePending > 0 ||
    summary.overdue > 0 ||
    summary.receivablePending > 0

  function openCreate() {
    setEditing(null)
    setFormCategoryType('expense')
    setOpen(true)
  }

  function openEdit(bill: Bill) {
    setEditing(bill)
    setFormCategoryType(categoryTypeForBillKind(bill.kind))
    setOpen(true)
  }

  function closeModal() {
    setOpen(false)
    setEditing(null)
  }

  const saveMutation = useMutation({
    mutationFn: (values: BillFormValues) => {
      if (editing) {
        return billsApi.updateBill(contextId!, editing.id, {
          description: values.description,
          amount: values.amount,
          due_date: values.due_date,
          category_id: values.category_id || null,
          barcode: values.barcode || null,
        })
      }
      return billsApi.createBill(contextId!, {
        description: values.description,
        amount: values.amount,
        due_date: values.due_date,
        kind: values.kind,
        status: values.status,
        category_id: values.category_id || null,
        barcode: values.barcode || null,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bills'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toastSuccess(editing ? b.updated : b.created)
      closeModal()
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (billId: string) => billsApi.deleteBill(contextId!, billId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bills'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toastSuccess(b.deleted)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  const payMutation = useMutation({
    mutationFn: (values: { account_id: string; occurred_at: string | null }) =>
      billsApi.payBill(contextId!, paying!.id, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bills'] })
      await queryClient.invalidateQueries({ queryKey: ['transactions'] })
      await queryClient.invalidateQueries({ queryKey: ['accounts'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toastSuccess(b.paid)
      setPaying(null)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  async function handleDelete(billId: string) {
    if (
      !(await confirm({
        message: b.confirmDelete,
        tone: 'danger',
      }))
    ) {
      return
    }
    deleteMutation.mutate(billId)
  }

  const canMutate = Boolean(contextId) && !isConsolidated

  return (
    <div className="space-y-6 bg-canvas text-fg">
      <PageHeader
        title={b.title}
        actions={
          <Button onClick={openCreate} disabled={!canMutate}>
            <Plus size={16} aria-hidden />
            {b.create}
          </Button>
        }
      />

      {isConsolidated ? (
        <p className="text-sm text-fg-muted">{strings.common.consolidatedHint}</p>
      ) : null}

      <BillFiltersBar
        state={filterState}
        onChange={patch}
        onClear={clear}
        contextId={isConsolidated ? null : activeScope}
        debouncedSearch={debouncedSearch}
      />

      {listQuery.isLoading ? (
        <LoadingBlock label={strings.common.loading} />
      ) : null}
      {listQuery.isError ? (
        <ErrorBanner message={getErrorMessage(listQuery.error)} />
      ) : null}

      {!listQuery.isLoading && hasSummary ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat
            label={b.summary.payablePending}
            value={<Money amount={summary.payablePending} size="lg" />}
            tone="negative"
          />
          <Stat
            label={b.summary.overdue}
            value={<Money amount={summary.overdue} size="lg" />}
            tone="negative"
          />
          <Stat
            label={b.summary.receivablePending}
            value={<Money amount={summary.receivablePending} size="lg" />}
            tone="positive"
          />
        </div>
      ) : null}

      {!listQuery.isLoading && (listQuery.data?.length ?? 0) === 0 ? (
        <EmptyState message={b.empty} />
      ) : null}

      {!listQuery.isLoading &&
      (listQuery.data?.length ?? 0) > 0 &&
      data.length === 0 ? (
        <EmptyState message={b.emptyFiltered} />
      ) : null}

      <BillList
        rows={data}
        categoryMap={categoryMap}
        isConsolidated={isConsolidated}
        canMutate={canMutate}
        onPay={setPaying}
        onEdit={openEdit}
        onDelete={handleDelete}
        deletePending={deleteMutation.isPending}
      />

      {open && contextId ? (
        <Modal
          title={editing ? b.edit : b.create}
          onClose={closeModal}
        >
          <BillForm
            editing={editing}
            categories={formCategoriesQuery.data ?? []}
            isPending={saveMutation.isPending}
            error={saveMutation.isError ? getErrorMessage(saveMutation.error) : null}
            onSubmit={(values) => saveMutation.mutate(values)}
            onCancel={closeModal}
            onQuickAddCategory={() => setCategoryOpen(true)}
            onKindChange={(kind) =>
              setFormCategoryType(categoryTypeForBillKind(kind))
            }
          />
        </Modal>
      ) : null}

      {paying && contextId ? (
        <Modal title={b.payTitle} onClose={() => setPaying(null)}>
          <PayBillForm
            bill={paying}
            accounts={payAccountsQuery.data ?? []}
            isPending={payMutation.isPending}
            error={
              payMutation.isError ? getErrorMessage(payMutation.error) : null
            }
            onSubmit={(values) => payMutation.mutate(values)}
            onCancel={() => setPaying(null)}
          />
        </Modal>
      ) : null}

      {contextId ? (
        <CategoryModal
          contextId={contextId}
          open={categoryOpen}
          onClose={() => setCategoryOpen(false)}
          defaultType={formCategoryType}
          onCreated={() => {
            void queryClient.invalidateQueries({
              queryKey: ['categories', contextId, formCategoryType],
            })
          }}
        />
      ) : null}
    </div>
  )
}
