import { useMemo, useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { categoriesApi } from '@/api'
import {
  Badge,
  Button,
  Field,
  Modal,
  TextInput,
  TextSelect,
} from '@/components/ui'
import {
  countActiveBillFilters,
  type BillFilterState,
} from '@/components/bills/billFilterState'
import { strings } from '@/i18n/pt-BR'

const t = strings.bills.filters
const b = strings.bills

type FilterFieldsProps = {
  state: BillFilterState
  onChange: (patch: Partial<BillFilterState>) => void
  contextId: string | null
}

function FilterFields({ state, onChange, contextId }: FilterFieldsProps) {
  const categoriesQuery = useQuery({
    queryKey: ['categories', contextId],
    queryFn: () => categoriesApi.listCategories(contextId!),
    enabled: Boolean(contextId),
  })

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
      <Field label={t.status}>
        <TextSelect
          value={state.status}
          onChange={(e) =>
            onChange({
              status: e.target.value as BillFilterState['status'],
            })
          }
        >
          <option value="">{t.statusAll}</option>
          <option value="pending">{b.statuses.pending}</option>
          <option value="paid">{b.statuses.paid}</option>
          <option value="overdue">{b.statuses.overdue}</option>
        </TextSelect>
      </Field>
      <Field label={t.direction}>
        <TextSelect
          value={state.direction}
          onChange={(e) =>
            onChange({
              direction: e.target.value as BillFilterState['direction'],
            })
          }
        >
          <option value="">{t.directionAll}</option>
          <option value="payable">{b.kinds.payable}</option>
          <option value="receivable">{b.kinds.receivable}</option>
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

type BillFiltersBarProps = {
  state: BillFilterState
  onChange: (patch: Partial<BillFilterState>) => void
  onClear: () => void
  contextId: string | null
  debouncedSearch: string
}

export function BillFiltersBar({
  state,
  onChange,
  onClear,
  contextId,
  debouncedSearch,
}: BillFiltersBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const activeCount = useMemo(() => {
    const withDebounced = { ...state, search: debouncedSearch }
    return countActiveBillFilters(withDebounced)
  }, [state, debouncedSearch])

  const clearButton =
    activeCount > 0 ? (
      <Button type="button" variant="ghost" size="sm" onClick={onClear}>
        {t.clear}
      </Button>
    ) : null

  return (
    <>
      <div className="hidden rounded-2xl border border-line bg-surface p-4 md:block">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-fg-muted" aria-hidden />
            <span className="text-sm font-medium text-fg">{t.title}</span>
            {activeCount > 0 ? <Badge tone="brand">{activeCount}</Badge> : null}
          </div>
          {clearButton}
        </div>
        <FilterFields state={state} onChange={onChange} contextId={contextId} />
      </div>

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
