import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { accountsApi, categoriesApi } from '@/api'
import { Button, ErrorBanner, Field, TextSelect } from '@/components/ui'
import {
  moveSchema,
  type MoveFormValues,
} from '@/components/transactions/schemas'
import { strings } from '@/i18n/pt-BR'
import { formatMoney } from '@/lib/format'
import type { StatementEntry } from '@/types/models'

const t = strings.transactions

type MoveTransactionFormProps = {
  transaction: StatementEntry
  excludeContextId: string
  contexts: { id: string; name: string }[]
  isPending?: boolean
  error?: string | null
  onSubmit: (values: MoveFormValues) => void
  onCancel: () => void
}

export function MoveTransactionForm({
  transaction,
  excludeContextId,
  contexts,
  isPending = false,
  error,
  onSubmit,
  onCancel,
}: MoveTransactionFormProps) {
  const form = useForm<MoveFormValues>({
    resolver: zodResolver(moveSchema),
    defaultValues: {
      target_context_id: '',
      target_account_id: '',
      target_category_id: null,
    },
  })

  const targetContextId = form.watch('target_context_id')
  const entryType = transaction.type === 'income' ? 'income' : 'expense'

  useEffect(() => {
    form.setValue('target_account_id', '')
    form.setValue('target_category_id', null)
  }, [targetContextId, form])

  const moveAccountsQuery = useQuery({
    queryKey: ['accounts', targetContextId],
    queryFn: () => accountsApi.listAccounts(targetContextId),
    enabled: Boolean(targetContextId),
  })

  const moveCategoriesQuery = useQuery({
    queryKey: ['categories', targetContextId, entryType],
    queryFn: () =>
      categoriesApi.listCategories(targetContextId, { type: entryType }),
    enabled: Boolean(targetContextId) && transaction.type !== 'transfer',
  })

  const otherContexts = contexts.filter((ctx) => ctx.id !== excludeContextId)
  const moveAccounts = moveAccountsQuery.data ?? []
  const moveCategories = moveCategoriesQuery.data ?? []

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <p className="text-sm text-fg-muted">
        {transaction.description} · {formatMoney(transaction.amount)}
      </p>

      <Field
        label={t.targetContext}
        error={form.formState.errors.target_context_id?.message}
      >
        <TextSelect {...form.register('target_context_id')}>
          <option value="">{strings.common.select}</option>
          {otherContexts.map((ctx) => (
            <option key={ctx.id} value={ctx.id}>
              {ctx.name}
            </option>
          ))}
        </TextSelect>
      </Field>

      <Field
        label={t.targetAccount}
        error={form.formState.errors.target_account_id?.message}
      >
        <TextSelect {...form.register('target_account_id')}>
          <option value="">{strings.common.select}</option>
          {moveAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </TextSelect>
      </Field>

      {transaction.type !== 'transfer' ? (
        <Field label={t.category}>
          <TextSelect
            {...form.register('target_category_id', {
              setValueAs: (v: string) => (v === '' ? null : v),
            })}
          >
            <option value="">{strings.common.select}</option>
            {moveCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.parent_id ? `↳ ${cat.name}` : cat.name}
              </option>
            ))}
          </TextSelect>
        </Field>
      ) : null}

      {error ? <ErrorBanner message={error} /> : null}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {strings.common.cancel}
        </Button>
        <Button type="submit" loading={isPending} disabled={isPending}>
          {t.move}
        </Button>
      </div>
    </form>
  )
}
