import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { budgetsApi, categoriesApi } from '@/api'
import { BudgetCard } from '@/components/budgets/BudgetCard'
import { BudgetCreateForm } from '@/components/budgets/BudgetCreateForm'
import { summarizeBudgets } from '@/components/budgets/budgetSummary'
import {
  Button,
  EmptyState,
  ErrorBanner,
  Field,
  LoadingBlock,
  Modal,
  Money,
  PageHeader,
  ProgressBar,
  Stat,
  TextInput,
} from '@/components/ui'
import { useWritableContextId } from '@/hooks/useWritableContextId'
import { strings } from '@/i18n/pt-BR'
import { formatMonthLabel } from '@/lib/dates'
import { getErrorMessage } from '@/lib/errors'
import { useMonthStore } from '@/store/monthStore'
import { toastError, toastSuccess } from '@/store/toastStore'
import type { BudgetProgress } from '@/api/budgets'

const t = strings.budgets

export function BudgetsPage() {
  const contextId = useWritableContextId()
  const month = useMonthStore((state) => state.month)
  const queryClient = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<BudgetProgress | null>(null)
  const [editLimit, setEditLimit] = useState('')

  const budgets = useQuery({
    queryKey: ['budgets', contextId, month],
    queryFn: () => budgetsApi.listBudgets(contextId as string, month),
    enabled: Boolean(contextId),
  })

  const categories = useQuery({
    queryKey: ['categories', contextId, 'expense'],
    queryFn: () =>
      categoriesApi.listCategories(contextId as string, { type: 'expense' }),
    enabled: Boolean(contextId) && creating,
  })

  const summary = useMemo(
    () => summarizeBudgets(budgets.data ?? []),
    [budgets.data],
  )

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['budgets'] })

  const create = useMutation({
    mutationFn: (values: { categoryId: string; limit: number }) =>
      budgetsApi.createBudget(contextId as string, {
        category_id: values.categoryId,
        limit_amount: values.limit,
      }),
    onSuccess: () => {
      void invalidate()
      toastSuccess(strings.common.save)
      setCreating(false)
    },
    onError: (error) => toastError(getErrorMessage(error)),
  })

  const update = useMutation({
    mutationFn: (values: { budgetId: number; limit: number }) =>
      budgetsApi.updateBudget(contextId as string, values.budgetId, values.limit),
    onSuccess: () => {
      void invalidate()
      toastSuccess(strings.common.save)
      setEditing(null)
      setEditLimit('')
    },
    onError: (error) => toastError(getErrorMessage(error)),
  })

  const remove = useMutation({
    mutationFn: (budgetId: number) =>
      budgetsApi.deleteBudget(contextId as string, budgetId),
    onSuccess: () => void invalidate(),
    onError: (error) => toastError(getErrorMessage(error)),
  })

  function openEdit(row: BudgetProgress) {
    setEditing(row)
    setEditLimit(String(row.limit))
  }

  if (!contextId) {
    return (
      <div className="space-y-4 bg-canvas text-fg">
        <PageHeader title={t.title} />
        <ErrorBanner message={t.pickContext} />
      </div>
    )
  }

  const rows = budgets.data ?? []

  return (
    <div className="space-y-6 bg-canvas text-fg">
      <PageHeader
        title={t.title}
        description={`${t.description} · ${formatMonthLabel(month)}`}
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} /> {t.newBudget}
          </Button>
        }
      />

      {budgets.isLoading ? <LoadingBlock label={strings.common.loading} /> : null}
      {budgets.isError ? (
        <ErrorBanner message={getErrorMessage(budgets.error)} />
      ) : null}

      {summary ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat
              label={t.totalSpent}
              value={<Money amount={summary.spent} size="lg" />}
              tone="negative"
            />
            <Stat
              label={t.totalLimit}
              value={<Money amount={summary.limit} size="lg" />}
              hint={
                summary.overCount > 0
                  ? t.overCount(summary.overCount)
                  : undefined
              }
            />
          </div>
          <ProgressBar
            value={summary.pct}
            tone={summary.overCount > 0 ? 'negative' : 'brand'}
            label={t.totalSpent}
          />
        </div>
      ) : null}

      {!budgets.isLoading && rows.length === 0 ? (
        <EmptyState message={t.empty} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {rows.map((row) => (
          <BudgetCard
            key={row.budget_id}
            row={row}
            onEdit={() => openEdit(row)}
            onDelete={() => remove.mutate(row.budget_id)}
            deletePending={remove.isPending}
          />
        ))}
      </div>

      {creating ? (
        <Modal title={t.newBudget} onClose={() => setCreating(false)}>
          <BudgetCreateForm
            categories={categories.data ?? []}
            isPending={create.isPending}
            error={create.isError ? getErrorMessage(create.error) : null}
            onSubmit={(values) => create.mutate(values)}
            onCancel={() => setCreating(false)}
          />
        </Modal>
      ) : null}

      {editing ? (
        <Modal
          title={t.editLimit}
          onClose={() => {
            setEditing(null)
            setEditLimit('')
          }}
        >
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              update.mutate({
                budgetId: editing.budget_id,
                limit: Number(editLimit),
              })
            }}
          >
            <p className="text-sm text-fg-muted">{editing.category_name}</p>
            <Field label={t.limit}>
              <TextInput
                type="number"
                step="0.01"
                min="0.01"
                inputMode="decimal"
                value={editLimit}
                onChange={(event) => setEditLimit(event.target.value)}
              />
            </Field>
            {update.isError ? (
              <ErrorBanner message={getErrorMessage(update.error)} />
            ) : null}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditing(null)
                  setEditLimit('')
                }}
              >
                {strings.common.cancel}
              </Button>
              <Button
                type="submit"
                disabled={Number(editLimit) <= 0 || update.isPending}
              >
                {strings.common.save}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  )
}
