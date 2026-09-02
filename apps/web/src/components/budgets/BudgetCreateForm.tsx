import { useState } from 'react'
import {
  Button,
  ErrorBanner,
  Field,
  TextInput,
  TextSelect,
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
  const [limit, setLimit] = useState('')

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit({ categoryId, limit: Number(limit) })
      }}
    >
      <Field label={t.category}>
        <TextSelect
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
        >
          <option value="">{strings.common.select}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </TextSelect>
      </Field>
      <Field label={t.limit}>
        <TextInput
          type="number"
          step="0.01"
          min="0.01"
          inputMode="decimal"
          value={limit}
          onChange={(event) => setLimit(event.target.value)}
        />
      </Field>
      {error ? <ErrorBanner message={error} /> : null}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {strings.common.cancel}
        </Button>
        <Button
          type="submit"
          disabled={!categoryId || Number(limit) <= 0 || isPending}
        >
          {strings.common.save}
        </Button>
      </div>
    </form>
  )
}
