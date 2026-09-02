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
import {
  debtSchema,
  emptyDebtValues,
  type DebtFormValues,
} from '@/components/debts/schemas'
import { strings } from '@/i18n/pt-BR'
import type { Debt } from '@/types/models'

const t = strings.debts

type DebtFormProps = {
  editing?: Debt | null
  isPending?: boolean
  error?: string | null
  onSubmit: (values: DebtFormValues) => void
  onCancel: () => void
}

export function DebtForm({
  editing,
  isPending,
  error,
  onSubmit,
  onCancel,
}: DebtFormProps) {
  const form = useForm<DebtFormValues>({
    resolver: zodResolver(debtSchema),
    defaultValues: editing
      ? {
          description: editing.description,
          amount: editing.amount,
          direction: editing.direction,
          counterparty: editing.counterparty ?? '',
          due_date: editing.due_date ?? '',
          notes: editing.notes ?? '',
        }
      : emptyDebtValues,
  })

  return (
    <form
      className="grid gap-4"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <Field
        label={t.description}
        error={form.formState.errors.description?.message}
      >
        <TextInput {...form.register('description')} />
      </Field>
      <Field label={t.amount} error={form.formState.errors.amount?.message}>
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
      {!editing ? (
        <Field label={t.direction}>
          <TextSelect {...form.register('direction')}>
            <option value="i_owe">{t.directions.i_owe}</option>
            <option value="owed_to_me">{t.directions.owed_to_me}</option>
          </TextSelect>
        </Field>
      ) : (
        <p className="text-sm text-fg-muted">
          {t.directions[editing.direction]}
        </p>
      )}
      <Field label={t.counterparty}>
        <TextInput {...form.register('counterparty')} />
      </Field>
      <Field label={t.dueDate}>
        <Controller
          name="due_date"
          control={form.control}
          render={({ field }) => (
            <DatePickerField
              key={editing?.id ?? 'new'}
              value={field.value ?? ''}
              onChange={field.onChange}
            />
          )}
        />
      </Field>
      <Field label={t.notes}>
        <TextInput {...form.register('notes')} />
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
