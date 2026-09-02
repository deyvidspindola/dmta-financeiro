import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  ErrorBanner,
  Field,
  TextInput,
  TextSelect,
} from '@/components/ui'
import {
  emptyRecurringValues,
  recurringSchema,
  type RecurringFormValues,
} from '@/components/recurring/schemas'
import { strings } from '@/i18n/pt-BR'
import type { Account, Category } from '@/types/models'

const r = strings.recurring
const tx = strings.transactions

type RecurringFormProps = {
  accounts: Account[]
  categories: Category[]
  isPending?: boolean
  error?: string | null
  onSubmit: (values: RecurringFormValues) => void
  onCancel: () => void
  onQuickAddCategory: () => void
}

export function RecurringForm({
  accounts,
  categories,
  isPending,
  error,
  onSubmit,
  onCancel,
  onQuickAddCategory,
}: RecurringFormProps) {
  const form = useForm<RecurringFormValues>({
    resolver: zodResolver(recurringSchema),
    defaultValues: emptyRecurringValues,
  })

  const watchedType = form.watch('type')
  const noEnd = form.watch('no_end')

  useEffect(() => {
    form.setValue('category_id', null)
  }, [watchedType, form])

  const filteredCategories = categories.filter((cat) => cat.type === watchedType)

  return (
    <form
      className="grid gap-4"
      onSubmit={form.handleSubmit((values) => onSubmit(values))}
    >
      <Field
        label={r.account}
        error={form.formState.errors.account_id?.message}
      >
        <TextSelect {...form.register('account_id')}>
          <option value="">{strings.common.select}</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </TextSelect>
      </Field>
      <Field
        label={r.description}
        error={form.formState.errors.description?.message}
      >
        <TextInput {...form.register('description')} />
      </Field>
      <Field label={r.amount} error={form.formState.errors.amount?.message}>
        <TextInput type="number" step="0.01" {...form.register('amount')} />
      </Field>
      <Field label={r.type}>
        <TextSelect {...form.register('type')}>
          <option value="expense">{tx.types.expense}</option>
          <option value="income">{tx.types.income}</option>
        </TextSelect>
      </Field>
      <Field label={r.interval}>
        <TextSelect {...form.register('interval')}>
          <option value="weekly">{r.intervals.weekly}</option>
          <option value="monthly">{r.intervals.monthly}</option>
          <option value="yearly">{r.intervals.yearly}</option>
        </TextSelect>
      </Field>
      <Field
        label={r.start}
        error={form.formState.errors.start_date?.message}
      >
        <TextInput type="date" {...form.register('start_date')} />
      </Field>
      <label className="flex items-center gap-2 text-sm text-fg">
        <input
          type="checkbox"
          className="size-4 rounded border-line"
          {...form.register('no_end')}
        />
        {r.noEnd}
      </label>
      {!noEnd ? (
        <Field label={r.end}>
          <TextInput type="date" {...form.register('end_date')} />
        </Field>
      ) : null}
      <Field label={strings.bills.category}>
        <div className="flex flex-col gap-2 sm:flex-row">
          <TextSelect
            className="min-w-0 flex-1"
            {...form.register('category_id', {
              setValueAs: (v: string) => (v === '' ? null : v),
            })}
          >
            <option value="">{strings.common.select}</option>
            {filteredCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.parent_id ? `↳ ${cat.name}` : cat.name}
              </option>
            ))}
          </TextSelect>
          <Button type="button" variant="ghost" onClick={onQuickAddCategory}>
            {strings.categories.quickAdd}
          </Button>
        </div>
      </Field>
      {error ? <ErrorBanner message={error} /> : null}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {strings.common.cancel}
        </Button>
        <Button type="submit" disabled={isPending}>
          {strings.common.save}
        </Button>
      </div>
    </form>
  )
}
