import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeftRight } from 'lucide-react'
import { accountsApi } from '@/api'
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
  transferSchema,
  type TransferFormValues,
} from '@/components/transactions/schemas'
import { strings } from '@/i18n/pt-BR'

const t = strings.transfers
const tx = strings.transactions

type TransferFormProps = {
  contextId: string
  contexts: { id: string; name: string }[]
  isPending?: boolean
  error?: string | null
  onSubmit: (values: TransferFormValues) => void
  onCancel: () => void
}

export function TransferForm({
  contextId,
  contexts,
  isPending = false,
  error,
  onSubmit,
  onCancel,
}: TransferFormProps) {
  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      from_account_id: '',
      to_account_id: '',
      to_context_id: contextId,
      amount: 0,
      description: '',
      occurred_at: new Date().toISOString().slice(0, 10),
    },
  })

  const transferToContextId = form.watch('to_context_id')

  useEffect(() => {
    form.setValue('to_account_id', '')
  }, [transferToContextId, form])

  const accountsQuery = useQuery({
    queryKey: ['accounts', contextId],
    queryFn: () => accountsApi.listAccounts(contextId),
    enabled: Boolean(contextId),
  })

  const transferToAccountsQuery = useQuery({
    queryKey: ['accounts', transferToContextId],
    queryFn: () => accountsApi.listAccounts(transferToContextId),
    enabled: Boolean(transferToContextId),
  })

  const accounts = accountsQuery.data ?? []
  const transferToAccounts = transferToAccountsQuery.data ?? []

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <Field
        label={t.from}
        error={form.formState.errors.from_account_id?.message}
      >
        <TextSelect {...form.register('from_account_id')}>
          <option value="">{strings.common.select}</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </TextSelect>
      </Field>

      <Field
        label={t.toContext}
        error={form.formState.errors.to_context_id?.message}
      >
        <TextSelect {...form.register('to_context_id')}>
          {contexts.map((ctx) => (
            <option key={ctx.id} value={ctx.id}>
              {ctx.name}
            </option>
          ))}
        </TextSelect>
      </Field>

      <Field label={t.to} error={form.formState.errors.to_account_id?.message}>
        <TextSelect {...form.register('to_account_id')}>
          <option value="">{strings.common.select}</option>
          {transferToAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </TextSelect>
      </Field>

      <Field label={tx.amount} error={form.formState.errors.amount?.message}>
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
        label={tx.description}
        error={form.formState.errors.description?.message}
      >
        <TextInput {...form.register('description')} />
      </Field>

      <Field
        label={tx.date}
        error={form.formState.errors.occurred_at?.message}
      >
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
          <ArrowLeftRight size={16} aria-hidden />
          {strings.common.save}
        </Button>
      </div>
    </form>
  )
}
