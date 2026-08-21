import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { z } from 'zod'
import { accountsApi, categoriesApi, transactionsApi } from '@/api'
import { strings } from '@/i18n/pt-BR'
import { formatDate, formatMoney } from '@/lib/format'
import { currentMonthKey, isInMonth } from '@/lib/dates'
import { getErrorMessage } from '@/lib/errors'
import { useWritableContextId } from '@/hooks/useWritableContextId'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'
import { toastError, toastSuccess } from '@/store/toastStore'
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

const ALL_PERIODS = 'all'

const schema = z.object({
  description: z.string().min(1, strings.common.required),
  amount: z.coerce.number().positive(),
  date: z.string().min(1, strings.common.required),
  type: z.enum(['income', 'expense']),
  account_id: z.string().min(1, strings.common.required),
  category_id: z.string().min(1, strings.common.required),
})

type FormValues = z.infer<typeof schema>

export function TransactionsPage() {
  const queryClient = useQueryClient()
  const activeScope = useAuthStore((s) => s.activeScope)
  const contextId = useWritableContextId()
  const [open, setOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [period, setPeriod] = useState(currentMonthKey)
  const listContextId = activeScope === CONSOLIDATED ? null : activeScope

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['transactions', listContextId],
    queryFn: () => transactionsApi.listTransactions(listContextId!),
    enabled: Boolean(listContextId),
  })

  const periodOptions = useMemo(() => {
    const months = new Set<string>([currentMonthKey()])
    for (const tx of data) {
      if (tx.date.length >= 7) months.add(tx.date.slice(0, 7))
    }
    return [...months].sort((a, b) => b.localeCompare(a))
  }, [data])

  const filtered = useMemo(() => {
    if (period === ALL_PERIODS) return data
    return data.filter((tx) => isInMonth(tx.date, period))
  }, [data, period])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: '',
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      type: 'expense',
      account_id: '',
      category_id: '',
    },
  })

  const watchedType = form.watch('type')

  useEffect(() => {
    form.setValue('category_id', '')
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
      transactionsApi.createTransaction(contextId!, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['transactions'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toastSuccess(strings.transactions.created)
      setOpen(false)
      form.reset({
        description: '',
        amount: 0,
        date: new Date().toISOString().slice(0, 10),
        type: 'expense',
        account_id: '',
        category_id: '',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (transactionId: string) =>
      transactionsApi.deleteTransaction(contextId!, transactionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['transactions'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toastSuccess(strings.transactions.deleted)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  function handleDelete(transactionId: string) {
    if (!window.confirm(strings.transactions.confirmDelete)) return
    deleteMutation.mutate(transactionId)
  }

  const accounts = accountsQuery.data ?? []
  const categories = categoriesQuery.data ?? []

  return (
    <div className="stack">
      <PageHeader
        title={strings.transactions.title}
        actions={
          <Button
            onClick={() => setOpen(true)}
            disabled={!contextId || activeScope === CONSOLIDATED}
          >
            {strings.transactions.create}
          </Button>
        }
      />

      {activeScope === CONSOLIDATED ? (
        <ErrorBanner message="Selecione um contexto para cadastrar e listar lançamentos." />
      ) : null}

      {listContextId ? (
        <div className="filter-bar">
          <Field label={strings.transactions.period}>
            <TextSelect
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
            >
              <option value={ALL_PERIODS}>
                {strings.transactions.periodAll}
              </option>
              {periodOptions.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </TextSelect>
          </Field>
        </div>
      ) : null}

      {isLoading ? <LoadingBlock label={strings.common.loading} /> : null}
      {isError ? <ErrorBanner message={strings.common.error} /> : null}

      {!isLoading && listContextId && data.length === 0 ? (
        <EmptyState message={strings.transactions.empty} />
      ) : null}

      {!isLoading &&
      listContextId &&
      data.length > 0 &&
      filtered.length === 0 ? (
        <EmptyState message={strings.transactions.emptyMonth} />
      ) : null}

      {filtered.length > 0 ? (
        <DataTable
          headers={[
            strings.transactions.date,
            strings.transactions.description,
            strings.transactions.type,
            strings.transactions.amount,
            strings.common.actions,
          ]}
        >
          {filtered.map((tx) => (
            <tr key={tx.id}>
              <td>{formatDate(tx.date)}</td>
              <td>{tx.description}</td>
              <td>{strings.transactions.types[tx.type]}</td>
              <td className="mono">{formatMoney(tx.amount)}</td>
              <td className="actions-cell">
                <IconButton
                  label={strings.common.delete}
                  icon={Trash2}
                  variant="danger"
                  onClick={() => handleDelete(tx.id)}
                  disabled={deleteMutation.isPending || !contextId}
                />
              </td>
            </tr>
          ))}
        </DataTable>
      ) : null}

      {open && contextId ? (
        <Modal
          title={strings.transactions.create}
          onClose={() => setOpen(false)}
        >
          <form
            className="form-grid"
            onSubmit={form.handleSubmit((values) =>
              mutation.mutateAsync(values),
            )}
          >
            <Field
              label={strings.transactions.description}
              error={form.formState.errors.description?.message}
            >
              <TextInput {...form.register('description')} />
            </Field>
            <Field
              label={strings.transactions.amount}
              error={form.formState.errors.amount?.message}
            >
              <TextInput type="number" step="0.01" {...form.register('amount')} />
            </Field>
            <Field
              label={strings.transactions.date}
              error={form.formState.errors.date?.message}
            >
              <TextInput type="date" {...form.register('date')} />
            </Field>
            <Field label={strings.transactions.type}>
              <TextSelect {...form.register('type')}>
                <option value="expense">
                  {strings.transactions.types.expense}
                </option>
                <option value="income">
                  {strings.transactions.types.income}
                </option>
              </TextSelect>
            </Field>
            <Field
              label={strings.transactions.account}
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
            <Field
              label={strings.transactions.category}
              error={form.formState.errors.category_id?.message}
            >
              <div className="field-row">
                <TextSelect {...form.register('category_id')}>
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
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
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
