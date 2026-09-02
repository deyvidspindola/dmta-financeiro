import { useState } from 'react'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import {
  defaultBillFilterState,
  type BillFilterState,
} from '@/components/bills/billFilterState'

export function useBillFilters() {
  const [state, setState] = useState(() => defaultBillFilterState())
  const debouncedSearch = useDebouncedValue(state.search, 300)

  function patch(patch: Partial<BillFilterState>) {
    setState((prev) => ({ ...prev, ...patch }))
  }

  function clear() {
    setState(defaultBillFilterState())
  }

  return { state, debouncedSearch, patch, clear }
}
