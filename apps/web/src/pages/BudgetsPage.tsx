import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { budgetsApi, categoriesApi } from '@/api'
import {
  Button,
  EmptyState,
  ErrorBanner,
  Field,
  IconButton,
  LoadingBlock,
  Modal,
  PageHeader,
  TextInput,
  TextSelect,
} from '@/components/ui-legacy'
import { useWritableContextId } from '@/hooks/useWritableContextId'
import { strings } from '@/i18n/pt-BR'
import { getErrorMessage } from '@/lib/errors'
import { formatMoney } from '@/lib/format'
import { useMonthStore } from '@/store/monthStore'
import { toastError, toastSuccess } from '@/store/toastStore'

export function BudgetsPage() {
  const contextId = useWritableContextId()
  const month = useMonthStore((state) => state.month)
  const queryClient = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [categoryId, setCategoryId] = useState('')
  const [limit, setLimit] = useState('')

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

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['budgets'] })

  const create = useMutation({
    mutationFn: () =>
      budgetsApi.createBudget(contextId as string, {
        category_id: categoryId,
        limit_amount: Number(limit),
      }),
    onSuccess: () => {
      void invalidate()
      toastSuccess(strings.common.save)
      setCreating(false)
      setCategoryId('')
      setLimit('')
    },
    onError: (error) => toastError(getErrorMessage(error)),
  })

  const remove = useMutation({
    mutationFn: (budgetId: number) =>
      budgetsApi.deleteBudget(contextId as string, budgetId),
    onSuccess: () => void invalidate(),
    onError: (error) => toastError(getErrorMessage(error)),
  })

  if (!contextId) {
    return (
      <div className="page">
        <PageHeader title={strings.budgets.title} />
        <ErrorBanner message={strings.budgets.pickContext} />
      </div>
    )
  }

  const rows = budgets.data ?? []

  return (
    <div className="page">
      <PageHeader
        title={strings.budgets.title}
        description={strings.budgets.description}
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} /> {strings.budgets.newBudget}
          </Button>
        }
      />

      {budgets.isLoading ? <LoadingBlock label={strings.common.loading} /> : null}
      {budgets.isError ? (
        <ErrorBanner message={getErrorMessage(budgets.error)} />
      ) : null}

      {!budgets.isLoading && rows.length === 0 ? (
        <EmptyState message={strings.budgets.empty} />
      ) : null}

      <div className="budget-list">
        {rows.map((row) => {
          const pct = Math.min(100, row.percent)
          return (
            <div key={row.budget_id} className="budget-card">
              <div className="budget-card__head">
                <strong>{row.category_name}</strong>
                <IconButton
                  label={strings.common.delete}
                  icon={Trash2}
                  variant="danger"
                  onClick={() => remove.mutate(row.budget_id)}
                />
              </div>
              <div className="budget-bar">
                <div
                  className={`budget-bar__fill${row.over ? ' is-over' : ''}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="budget-card__foot">
                <span>
                  {formatMoney(row.spent)}{' '}
                  <span className="muted">/ {formatMoney(row.limit)}</span>
                </span>
                <span className={row.over ? 'negative' : 'muted'}>
                  {row.over
                    ? strings.budgets.over
                    : `${strings.budgets.remaining}: ${formatMoney(row.remaining)}`}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {creating ? (
        <Modal title={strings.budgets.newBudget} onClose={() => setCreating(false)}>
          <div className="form-grid">
            <Field label={strings.budgets.category}>
              <TextSelect
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
              >
                <option value="">{strings.common.select}</option>
                {(categories.data ?? []).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </TextSelect>
            </Field>
            <Field label={strings.budgets.limit}>
              <TextInput
                type="number"
                step="0.01"
                min="0.01"
                inputMode="decimal"
                value={limit}
                onChange={(event) => setLimit(event.target.value)}
              />
            </Field>
            <div className="form-grid__actions">
              <Button variant="ghost" onClick={() => setCreating(false)}>
                {strings.common.cancel}
              </Button>
              <Button
                onClick={() => create.mutate()}
                disabled={!categoryId || Number(limit) <= 0 || create.isPending}
              >
                {strings.common.save}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
