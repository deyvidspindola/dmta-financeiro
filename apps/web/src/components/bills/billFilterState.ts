import type { BillListFilters } from '@/api/bills'
import { monthDateRange } from '@/lib/dates'

export type BillFilterState = {
  status: '' | 'pending' | 'paid' | 'overdue' | 'cancelled'
  direction: '' | 'payable' | 'receivable'
  categoryId: string
  search: string
}

export function toApiBillFilters(
  state: BillFilterState,
  debouncedSearch: string,
  month: string,
): BillListFilters {
  const { from, to } = monthDateRange(month)
  const filters: BillListFilters = { from, to }
  if (state.status) filters.status = state.status
  if (state.direction) filters.direction = state.direction
  if (state.categoryId) filters.category_id = state.categoryId
  if (debouncedSearch.trim()) filters.q = debouncedSearch.trim()
  return filters
}

export function countActiveBillFilters(state: BillFilterState): number {
  let count = 0
  if (state.status) count++
  if (state.direction) count++
  if (state.categoryId) count++
  if (state.search.trim()) count++
  return count
}

export function defaultBillFilterState(): BillFilterState {
  return {
    status: '',
    direction: '',
    categoryId: '',
    search: '',
  }
}

/** Filtros client-side para visão consolidada (API sem query params). */
export function applyClientBillFilters<T extends {
  description: string
  due_date: string
  status: string
  kind: string
  category_id: string | null
}>(
  rows: T[],
  state: BillFilterState,
  debouncedSearch: string,
  month: string,
): T[] {
  const { from, to } = monthDateRange(month)
  const today = new Date().toISOString().slice(0, 10)
  return rows.filter((row) => {
    if (row.due_date < from) return false
    if (row.due_date > to) return false
    if (state.status === 'overdue') {
      if (!(row.status === 'pending' && row.due_date < today)) return false
    } else if (state.status && row.status !== state.status) return false
    if (state.direction && row.kind !== state.direction) return false
    if (state.categoryId && row.category_id !== state.categoryId) return false
    if (debouncedSearch.trim()) {
      const needle = debouncedSearch.trim().toLowerCase()
      if (!row.description.toLowerCase().includes(needle)) return false
    }
    return true
  })
}
