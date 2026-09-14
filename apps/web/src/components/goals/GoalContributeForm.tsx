import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { PiggyBank } from 'lucide-react'
import { accountsApi } from '@/api'
import {
  Button,
  DatePickerField,
  ErrorBanner,
  Field,
  MoneyInput,
  TextSelect,
} from '@/components/ui'
import {
  goalContributeSchema,
  type GoalContributeValues,
} from '@/components/goals/schemas'
import { strings } from '@/i18n/pt-BR'
import type { Goal } from '@/types/models'

const t = strings.goals

type GoalContributeFormProps = {
  goal: Goal
  contextId: string
  isPending?: boolean
  error?: string | null
  onSubmit: (values: GoalContributeValues) => void
  onCancel: () => void
}

export function GoalContributeForm({
  goal,
  contextId,
  isPending = false,
  error,
  onSubmit,
  onCancel,
}: GoalContributeFormProps) {
  const form = useForm<GoalContributeValues>({
    resolver: zodResolver(goalContributeSchema),
    defaultValues: {
      account_id: '',
      amount: 0,
      occurred_at: new Date().toISOString().slice(0, 10),
    },
  })

  const accountsQuery = useQuery({
    queryKey: ['accounts', contextId],
    queryFn: () => accountsApi.listAccounts(contextId),
    enabled: Boolean(contextId),
  })
  const accounts = accountsQuery.data ?? []

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <p className="text-sm text-fg-muted">{goal.name}</p>

      <Field label={t.contributeAmount} error={form.formState.errors.amount?.message}>
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

      <Field
        label={t.contributeAccount}
        error={form.formState.errors.account_id?.message}
      >
        <TextSelect {...form.register('account_id')}>
          <option value="">{strings.common.select}</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </TextSelect>
      </Field>

      <Field label={t.contributeDate} error={form.formState.errors.occurred_at?.message}>
        <Controller
          name="occurred_at"
          control={form.control}
          render={({ field }) => (
            <DatePickerField
              value={field.value}
              onChange={field.onChange}
              aria-invalid={Boolean(form.formState.errors.occurred_at)}
            />
          )}
        />
      </Field>

      {error ? <ErrorBanner message={error} /> : null}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {strings.common.cancel}
        </Button>
        <Button type="submit" loading={isPending} disabled={isPending}>
          <PiggyBank size={16} aria-hidden />
          {t.contribute}
        </Button>
      </div>
    </form>
  )
}
