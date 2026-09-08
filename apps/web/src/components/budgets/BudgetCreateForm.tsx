import { useState } from 'react'
import {
  Button,
  CategorySelect,
  ErrorBanner,
  Field,
  MoneyInput,
} from '@/components/ui'
import type { Category } from '@/types/models'
import { strings } from '@/i18n/pt-BR'

const t = strings.budgets

type BudgetCreateFormProps = {
  categories: Category[]
  isPending?: boolean
  error?: string | null
  onSubmit: (values: { categoryId: string; limit: number }) => void
  onCancel: () => void
}

export function BudgetCreateForm({
  categories,
  isPending,
  error,
  onSubmit,
  onCancel,
}: BudgetCreateFormProps) {
  const [categoryId, setCategoryId] = useState('')
  const [limit, setLimit] = useState(0)

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit({ categoryId, limit })
      }}
    >
      <CategorySelect
        label={t.category}
        categories={categories}
        value={categoryId || null}
        onChange={(value) => setCategoryId(value || '')}
        placeholder={strings.common.select}
      />
      <Field label={t.limit}>
        <MoneyInput value={limit} onChange={setLimit} />
      </Field>
      {error ? <ErrorBanner message={error} /> : null}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {strings.common.cancel}
        </Button>
        <Button
          type="submit"
          disabled={!categoryId || limit <= 0 || isPending}
        >
          {strings.common.save}
        </Button>
      </div>
    </form>
  )
}
