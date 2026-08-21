import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { z } from 'zod'
import { accountsApi, categoriesApi, recurringTransactionsApi } from '@/api'
import { CategoryModal } from '@/components/CategoryModal'
import {
  Button,
  DataTable,
  EmptyState,
  ErrorBanner,
  Field,
  IconButton,
  LoadingBlock,
  Modal,
  PageHeader,
  TextInput,
  TextSelect,
} from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { formatDate, formatMoney } from '@/lib/format'
import { getErrorMessage } from '@/lib/errors'
import { useWritableContextId } from '@/hooks/useWritableContextId'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'
import { toastError, toastSuccess } from '@/store/toastStore'

const schema = z.object({
  account_id: z.string().min(1, strings.common.required),
  description: z.string().min(1, strings.common.required),
  amount: z.coerce.number().positive(),
  type: z.enum(['income', 'expense']),
  interval: z.enum(['weekly', 'monthly', 'yearly']),
  start_date: z.string().min(1, strings.common.required),
  end_date: z.string().optional(),
  category_id: z.string().nullable(),
  no_end: z.boolean(),
})

type FormValues = z.infer<typeof schema>

export function RecurringTransactionsPage() {
  const queryClient = useQueryClient()
  const activeScope = useAuthStore((s) => s.activeScope)
  const contextId = useWritableContextId()
  const listContextId = activeScope === CONSOLIDATED ? null : activeScope
  const [open, setOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)

  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ['recurring-transactions', listContextId],
    queryFn: () =>
      recurringTransactionsApi.listRecurringTransactions(listContextId!),
    enabled: Boolean(listContextId),
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      account_id: '',
      description: '',
      amount: 0,
      type: 'expense',
      interval: 'monthly',
      start_date: new Date().toISOString().slice(0, 10),
      end_date: '',
      category_id: null,
      no_end: true,
    },
  })

  const watchedType = form.watch('type')
  const noEnd = form.watch('no_end')

  useEffect(() => {
    form.setValue('category_id', null)
  }, [watchedType, form])

  const accountsQuery = useQuery({
    queryKey: ['accounts', contextId],
    queryFn: () => accountsApi.listAccounts(contextId!),
    enabled: Boolean(contextId) && open,
  })

  const categoriesQuery = useQuery({
    queryKey: ['categories', contextId, watchedType],
    queryFn: () =>
      categoriesApi.listCategories(contextId!, { type: watchedType }),
    enabled: Boolean(contextId) && open,
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      recurringTransactionsApi.createRecurringTransaction(contextId!, {
        account_id: values.account_id,
        description: values.description,
        amount: values.amount,
        type: values.type,
        interval: values.interval,
        start_date: values.start_date,
        end_date: values.no_end ? null : values.end_date || null,
        category_id: values.category_id || null,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['recurring-transactions'],
      })
      toastSuccess(strings.recurring.created)
      setOpen(false)
      form.reset({
        account_id: '',
        description: '',
        amount: 0,
        type: 'expense',
        interval: 'monthly',
        start_date: new Date().toISOString().slice(0, 10),
        end_date: '',
        category_id: null,
        no_end: true,
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (recurringId: string) =>
      recurringTransactionsApi.deleteRecurringTransaction(
        contextId!,
        recurringId,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['recurring-transactions'],
      })
      toastSuccess(strings.recurring.cancelled)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  function handleCancel(recurringId: string) {
    if (!window.confirm(strings.recurring.confirmCancel)) return
    deleteMutation.mutate(recurringId)
  }

  const accounts = accountsQuery.data ?? []
  const categories = categoriesQuery.data ?? []

  return (
    <div className="stack">
      <PageHeader
        title={strings.recurring.title}
        description={strings.recurring.hint}
        actions={
          <Button
            onClick={() => setOpen(true)}
            disabled={!contextId || activeScope === CONSOLIDATED}
          >
            {strings.recurring.create}
          </Button>
        }
      />

      {activeScope === CONSOLIDATED ? (
        <ErrorBanner message={strings.recurring.needContext} />
      ) : null}

      {isLoading ? <LoadingBlock label={strings.common.loading} /> : null}
      {isError ? <ErrorBanner message={getErrorMessage(error)} /> : null}

      {!isLoading && listContextId && data.length === 0 ? (
        <EmptyState message={strings.recurring.empty} />
      ) : null}

      {data.length > 0 ? (
        <DataTable
          headers={[
            strings.recurring.description,
            strings.recurring.amount,
            strings.recurring.type,
            strings.recurring.interval,
            strings.recurring.next,
            strings.recurring.end,
            strings.common.actions,
          ]}
        >
          {data.map((row) => (
            <tr key={row.id}>
              <td>{row.description}</td>
              <td className="mono">{formatMoney(row.amount)}</td>
              <td>{strings.transactions.types[row.type]}</td>
              <td>{strings.recurring.intervals[row.interval]}</td>
              <td>{formatDate(row.next_occurrence_date)}</td>
              <td>
                {row.end_date
                  ? formatDate(row.end_date)
                  : strings.recurring.fixed}
              </td>
              <td className="actions-cell">
                <IconButton
                  label={strings.recurring.cancel}
                  icon={Trash2}
                  variant="danger"
                  onClick={() => handleCancel(row.id)}
                  disabled={deleteMutation.isPending || !contextId}
                />
              </td>
            </tr>
          ))}
        </DataTable>
      ) : null}

      {open && contextId ? (
        <Modal title={strings.recurring.create} onClose={() => setOpen(false)}>
          <form
            className="form-grid"
            onSubmit={form.handleSubmit((values) =>
              mutation.mutateAsync(values),
            )}
          >
            <Field
              label={strings.transactions.account}
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
              label={strings.recurring.description}
              error={form.formState.errors.description?.message}
            >
              <TextInput {...form.register('description')} />
            </Field>
            <Field
              label={strings.recurring.amount}
              error={form.formState.errors.amount?.message}
            >
              <TextInput
                type="number"
                step="0.01"
                {...form.register('amount')}
              />
            </Field>
            <Field label={strings.recurring.type}>
              <TextSelect {...form.register('type')}>
                <option value="expense">
                  {strings.transactions.types.expense}
                </option>
                <option value="income">
                  {strings.transactions.types.income}
                </option>
              </TextSelect>
            </Field>
            <Field label={strings.recurring.interval}>
              <TextSelect {...form.register('interval')}>
                <option value="weekly">
                  {strings.recurring.intervals.weekly}
                </option>
                <option value="monthly">
                  {strings.recurring.intervals.monthly}
                </option>
                <option value="yearly">
                  {strings.recurring.intervals.yearly}
                </option>
              </TextSelect>
            </Field>
            <Field
              label={strings.recurring.start}
              error={form.formState.errors.start_date?.message}
            >
              <TextInput type="date" {...form.register('start_date')} />
            </Field>
            <label className="field checkbox-field">
              <span className="field__label">
                <input type="checkbox" {...form.register('no_end')} />{' '}
                {strings.recurring.noEnd}
              </span>
            </label>
            {!noEnd ? (
              <Field label={strings.recurring.end}>
                <TextInput type="date" {...form.register('end_date')} />
              </Field>
            ) : null}
            <Field label={strings.bills.category}>
              <div className="field-row">
                <TextSelect
                  {...form.register('category_id', {
                    setValueAs: (v: string) => (v === '' ? null : v),
                  })}
                >
                  <option value="">{strings.common.select}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.parent_id ? `↳ ${cat.name}` : cat.name}
                    </option>
                  ))}
                </TextSelect>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCategoryOpen(true)}
                >
                  {strings.categories.quickAdd}
                </Button>
              </div>
            </Field>
            {mutation.isError ? (
              <ErrorBanner message={getErrorMessage(mutation.error)} />
            ) : null}
            <div className="form-actions">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                {strings.common.cancel}
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {strings.common.save}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {contextId ? (
        <CategoryModal
          contextId={contextId}
          open={categoryOpen}
          onClose={() => setCategoryOpen(false)}
          defaultType={watchedType}
          onCreated={(categoryId) => form.setValue('category_id', categoryId)}
        />
      ) : null}
    </div>
  )
}
