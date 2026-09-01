import { useMemo } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { accountsApi, categoriesApi } from '@/api'
import {
  Badge,
  Button,
  Field,
  Modal,
  TextInput,
  TextSelect,
} from '@/components/ui'
import type { TransactionListFilters } from '@/api/transactions'
import { strings } from '@/i18n/pt-BR'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useState } from 'react'

const t = strings.transactions.filters
const tx = strings.transactions

export type TransactionFilterState = {
  from: string
  to: string
  accountId: string
  categoryId: string
  type: '' | 'income' | 'expense' | 'transfer'
  search: string
}

export function toApiFilters(
  state: TransactionFilterState,
  debouncedSearch: string,
): TransactionListFilters | undefined {
  const filters: TransactionListFilters = {}
  if (state.from) filters.from = state.from
  if (state.to) filters.to = state.to
  if (state.accountId) filters.account_id = state.accountId
  if (state.categoryId) filters.category_id = state.categoryId
  if (state.type) filters.type = state.type
  if (debouncedSearch.trim()) filters.q = debouncedSearch.trim()

  return Object.keys(filters).length > 0 ? filters : undefined
}

export function countActiveFilters(state: TransactionFilterState): number {
  let count = 0
  if (state.from) count++
  if (state.to) count++
  if (state.accountId) count++
  if (state.categoryId) count++
  if (state.type) count++
  if (state.search.trim()) count++
  return count
}

function lastDayOfMonth(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  if (!year || !month) return monthKey
  const last = new Date(year, month, 0).getDate()
  return `${monthKey}-${String(last).padStart(2, '0')}`
}

export function defaultFilterState(monthKey: string): TransactionFilterState {
  return {
    from: `${monthKey}-01`,
    to: lastDayOfMonth(monthKey),
    accountId: '',
    categoryId: '',
    type: '',
    search: '',
  }
}

type FilterFieldsProps = {
  state: TransactionFilterState
  onChange: (patch: Partial<TransactionFilterState>) => void
  contextId: string | null
}

function FilterFields({ state, onChange, contextId }: FilterFieldsProps) {
  const accountsQuery = useQuery({
    queryKey: ['accounts', contextId],
    queryFn: () => accountsApi.listAccounts(contextId!),
    enabled: Boolean(contextId),
  })

  const categoriesQuery = useQuery({
    queryKey: ['categories', contextId],
    queryFn: () => categoriesApi.listCategories(contextId!),
    enabled: Boolean(contextId),
  })

  const accounts = accountsQuery.data ?? []
  const categories = categoriesQuery.data ?? []

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Field label={t.from}>
        <TextInput
          type="date"
          value={state.from}
          onChange={(e) => onChange({ from: e.target.value })}
        />
      </Field>
      <Field label={t.to}>
        <TextInput
          type="date"
          value={state.to}
          onChange={(e) => onChange({ to: e.target.value })}
        />
      </Field>
      <Field label={t.account}>
        <TextSelect
          value={state.accountId}
          onChange={(e) => onChange({ accountId: e.target.value })}
        >
          <option value="">{t.allAccounts}</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </TextSelect>
      </Field>
      <Field label={t.category}>
        <TextSelect
          value={state.categoryId}
          onChange={(e) => onChange({ categoryId: e.target.value })}
        >
          <option value="">{t.allCategories}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.parent_id ? `↳ ${cat.name}` : cat.name}
            </option>
          ))}
        </TextSelect>
      </Field>
      <Field label={t.type}>
        <TextSelect
          value={state.type}
          onChange={(e) =>
            onChange({
              type: e.target.value as TransactionFilterState['type'],
            })
          }
        >
          <option value="">{t.typeAll}</option>
          <option value="income">{tx.types.income}</option>
          <option value="expense">{tx.types.expense}</option>
          <option value="transfer">{tx.types.transfer}</option>
        </TextSelect>
      </Field>
      <Field label={t.search}>
        <TextInput
          type="search"
          placeholder={t.searchPlaceholder}
          value={state.search}
          onChange={(e) => onChange({ search: e.target.value })}
        />
      </Field>
    </div>
  )
}

type TransactionFiltersBarProps = {
  state: TransactionFilterState
  onChange: (patch: Partial<TransactionFilterState>) => void
  onClear: () => void
  contextId: string | null
  debouncedSearch: string
}

export function TransactionFiltersBar({
  state,
  onChange,
  onClear,
  contextId,
  debouncedSearch,
}: TransactionFiltersBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const activeCount = useMemo(() => {
    const withDebounced = { ...state, search: debouncedSearch }
    return countActiveFilters(withDebounced)
  }, [state, debouncedSearch])

  const clearButton =
    activeCount > 0 ? (
      <Button type="button" variant="ghost" size="sm" onClick={onClear}>
        {t.clear}
      </Button>
    ) : null

  return (
    <>
      {/* Desktop */}
      <div className="hidden rounded-2xl border border-line bg-surface p-4 md:block">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-fg-muted" aria-hidden />
            <span className="text-sm font-medium text-fg">{t.title}</span>
            {activeCount > 0 ? (
              <Badge tone="brand">{activeCount}</Badge>
            ) : null}
          </div>
          {clearButton}
        </div>
        <FilterFields state={state} onChange={onChange} contextId={contextId} />
      </div>

      {/* Mobile */}
      <div className="flex items-center gap-2 md:hidden">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setMobileOpen(true)}
          className="flex-1"
        >
          <SlidersHorizontal size={16} aria-hidden />
          {t.title}
          {activeCount > 0 ? (
            <Badge tone="brand" className="ml-1">
              {activeCount}
            </Badge>
          ) : null}
        </Button>
        {clearButton}
      </div>

      {mobileOpen ? (
        <Modal title={t.title} onClose={() => setMobileOpen(false)}>
          <FilterFields
            state={state}
            onChange={onChange}
            contextId={contextId}
          />
          <div className="mt-4 flex justify-end gap-2">
            {activeCount > 0 ? (
              <Button type="button" variant="ghost" onClick={onClear}>
                {t.clear}
              </Button>
            ) : null}
            <Button type="button" onClick={() => setMobileOpen(false)}>
              {strings.common.close}
            </Button>
          </div>
        </Modal>
      ) : null}
    </>
  )
}

/** Hook auxiliar para estado + debounce de busca. */
export function useTransactionFilters(monthKey: string) {
  const [state, setState] = useState(() => defaultFilterState(monthKey))
  const debouncedSearch = useDebouncedValue(state.search, 300)

  function patch(patch: Partial<TransactionFilterState>) {
    setState((prev) => ({ ...prev, ...patch }))
  }

  function clear() {
    setState({
      from: '',
      to: '',
      accountId: '',
      categoryId: '',
      type: '',
      search: '',
    })
  }

  return { state, debouncedSearch, patch, clear, setState }
}
