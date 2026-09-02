import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  ErrorBanner,
  Field,
  TextInput,
} from '@/components/ui'
import {
  emptyGoalValues,
  goalSchema,
  type GoalFormValues,
} from '@/components/goals/schemas'
import { strings } from '@/i18n/pt-BR'
import { formatMoney } from '@/lib/format'
import type { Goal } from '@/types/models'

const t = strings.goals

type GoalFormProps = {
  editing?: Goal | null
  isPending?: boolean
  error?: string | null
  onSubmit: (values: GoalFormValues) => void
  onCancel: () => void
}

export function GoalForm({
  editing,
  isPending,
  error,
  onSubmit,
  onCancel,
}: GoalFormProps) {
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: editing
      ? {
          name: editing.name,
          target_amount: editing.target_amount,
          target_date: editing.target_date ?? '',
          notes: editing.notes ?? '',
        }
      : emptyGoalValues,
  })

  return (
    <form
      className="grid gap-4"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <Field label={t.name} error={form.formState.errors.name?.message}>
        <TextInput {...form.register('name')} />
      </Field>
      <Field
        label={t.targetAmount}
        error={form.formState.errors.target_amount?.message}
      >
        <TextInput type="number" step="0.01" {...form.register('target_amount')} />
      </Field>
      {editing ? (
        <p className="text-sm text-fg-muted">
          {t.currentAmount}: {formatMoney(editing.current_amount)} ·{' '}
          {editing.percent_complete}% · {t.statuses[editing.status]}
        </p>
      ) : null}
      <Field label={t.targetDate}>
        <TextInput type="date" {...form.register('target_date')} />
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
