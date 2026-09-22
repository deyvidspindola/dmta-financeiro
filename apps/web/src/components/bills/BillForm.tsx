import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  DatePickerField,
  ErrorBanner,
  Field,
  MoneyInput,
  TextInput,
  TextSelect,
} from '@/components/ui'
import { cn } from '@/lib/cn'
import { categoryTypeForBillKind } from '@/components/bills/billDisplay'
import {
  billSchema,
  emptyBillValues,
  type BillFormValues,
} from '@/components/bills/schemas'
import { strings } from '@/i18n/pt-BR'
import type { Bill, Category } from '@/types/models'

const b = strings.bills

type BillFormProps = {
  editing: Bill | null
  categories: Category[]
  isPending?: boolean
  error?: string | null
  onSubmit: (values: BillFormValues) => void
  onCancel: () => void
  onQuickAddCategory: () => void
  onKindChange?: (kind: BillFormValues['kind']) => void
}

export function BillForm({
  editing,
  categories,
  isPending,
  error,
  onSubmit,
  onCancel,
  onQuickAddCategory,
  onKindChange,
}: BillFormProps) {
  const isEdit = editing !== null
  const form = useForm<BillFormValues>({
    resolver: zodResolver(billSchema),
    defaultValues: emptyBillValues,
  })

  const watchedKind = form.watch('kind')
  const categoryType = categoryTypeForBillKind(watchedKind)
  const repeatMode = form.watch('repeat_mode')

  useEffect(() => {
    if (!isEdit) {
      form.setValue('category_id', null)
    }
  }, [watchedKind, form, isEdit])

  useEffect(() => {
    onKindChange?.(watchedKind)
  }, [watchedKind, onKindChange])

  useEffect(() => {
    if (editing) {
      form.reset({
        description: editing.description,
        amount: editing.amount,
        due_date: editing.due_date,
        kind: editing.kind,
        status: editing.status,
        category_id: editing.category_id,
        barcode: editing.barcode ?? '',
      })
      return
    }
    form.reset(emptyBillValues)
  }, [editing, form])

  const filteredCategories = categories.filter((cat) => cat.type === categoryType)

  return (
    <form
      className="grid gap-4"
      onSubmit={form.handleSubmit((values) => onSubmit(values))}
    >
      <Field
        label={b.description}
        error={form.formState.errors.description?.message}
      >
        <TextInput {...form.register('description')} />
      </Field>
      <Field label={b.amount} error={form.formState.errors.amount?.message}>
        <Controller
          name="amount"
          control={form.control}
          render={({ field }) => (
            <MoneyInput
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              aria-invalid={Boolean(form.formState.errors.amount)}
            />
          )}
        />
      </Field>
      <Field label={b.dueDate} error={form.formState.errors.due_date?.message}>
        <Controller
          name="due_date"
          control={form.control}
          render={({ field }) => (
            <DatePickerField
              key={editing?.id ?? 'new'}
              value={field.value}
              onChange={field.onChange}
              aria-invalid={Boolean(form.formState.errors.due_date)}
            />
          )}
        />
      </Field>
      {!isEdit ? (
        <>
          <Field label={b.kind}>
            <TextSelect {...form.register('kind')}>
              <option value="payable">{b.kinds.payable}</option>
              <option value="receivable">{b.kinds.receivable}</option>
            </TextSelect>
          </Field>
          <Field label={b.status}>
            <TextSelect {...form.register('status')}>
              {(
                Object.keys(b.statuses) as Array<keyof typeof b.statuses>
              ).map((key) => (
                <option key={key} value={key}>
                  {b.statuses[key]}
                </option>
              ))}
            </TextSelect>
          </Field>

          <Field label={b.repeat.label}>
            <div className="flex gap-2">
              {(['none', 'installments', 'recurring'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => form.setValue('repeat_mode', mode)}
                  className={cn(
                    'flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition',
                    repeatMode === mode
                      ? 'border-brand-600 bg-brand-500/10 text-brand-700 dark:text-brand-300'
                      : 'border-line bg-surface text-fg-muted hover:bg-surface-2',
                  )}
                >
                  {b.repeat[mode]}
                </button>
              ))}
            </div>
          </Field>

          {repeatMode === 'installments' ? (
            <Field
              label={b.repeat.installmentsCount}
              hint={b.repeat.installmentsHint}
              error={form.formState.errors.installments?.message}
            >
              <TextInput
                type="number"
                min={2}
                max={60}
                {...form.register('installments')}
              />
            </Field>
          ) : null}

          {repeatMode === 'recurring' ? (
            <>
              <Field label={b.repeat.interval}>
                <TextSelect {...form.register('interval')}>
                  {(
                    Object.keys(strings.recurring.intervals) as Array<
                      keyof typeof strings.recurring.intervals
                    >
                  ).map((key) => (
                    <option key={key} value={key}>
                      {strings.recurring.intervals[key]}
                    </option>
                  ))}
                </TextSelect>
              </Field>
              <Field label={b.repeat.endDate}>
                <Controller
                  name="end_date"
                  control={form.control}
                  render={({ field }) => (
                    <DatePickerField
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  )}
                />
              </Field>
              <p className="text-xs text-fg-muted">{b.repeat.recurringHint}</p>
            </>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-fg-muted">
          {b.kinds[editing.kind]} · {b.statuses[editing.status]}
        </p>
      )}
      <Field label={b.category}>
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
      <Field label={b.barcode}>
        <TextInput {...form.register('barcode')} />
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
