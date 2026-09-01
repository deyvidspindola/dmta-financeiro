import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, FolderInput, Pencil, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import {
  accountsApi,
  categoriesApi,
  goalsApi,
  transactionsApi,
} from '@/api'
import { OriginBadge } from '@/components/OriginBadge'
import { strings } from '@/i18n/pt-BR'
import { formatDate, formatMoney } from '@/lib/format'
import { getErrorMessage } from '@/lib/errors'
import {
  canMutateEntry,
  transactionDirection,
} from '@/lib/transactionDisplay'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'
import { toastError, toastSuccess } from '@/store/toastStore'
import {
  Button,
  ErrorBanner,
  Field,
  IconButton,
  LoadingBlock,
  Modal,
  MoneyValue,
  PageHeader,
  Panel,
  TextInput,
  TextSelect,
} from '@/components/ui-legacy'
import type { ReactNode } from 'react'

const entrySchema = z.object({
  description: z.string().min(1, strings.common.required),
  amount: z.coerce.number().positive(),
  date: z.string().min(1, strings.common.required),
  type: z.enum(['income', 'expense']),
  account_id: z.string().min(1, strings.common.required),
  category_id: z.string().nullable(),
})

const moveSchema = z.object({
  target_context_id: z.string().min(1, strings.common.required),
  target_account_id: z.string().min(1, strings.common.required),
  target_category_id: z.string().nullable(),
})

type EntryFormValues = z.infer<typeof entrySchema>
type MoveFormValues = z.infer<typeof moveSchema>

export function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const activeScope = useAuthStore((s) => s.activeScope)
  const contexts = useAuthStore((s) => s.contexts)

  const contextId =
    searchParams.get('context') ??
    (activeScope !== CONSOLIDATED ? activeScope : null)

  const [entryOpen, setEntryOpen] = useState(false)
  const [moving, setMoving] = useState(false)

  const txQuery = useQuery({
    queryKey: ['transaction', contextId, id],
    queryFn: () => transactionsApi.getTransaction(contextId!, id!),
    enabled: Boolean(contextId && id),
  })

  const tx = txQuery.data

  const accountsQuery = useQuery({
    queryKey: ['accounts', contextId],
    queryFn: () => accountsApi.listAccounts(contextId!),
    enabled: Boolean(contextId) && (entryOpen || Boolean(tx)),
  })

  const categoriesQuery = useQuery({
    queryKey: ['categories', contextId, tx?.type === 'income' ? 'income' : 'expense'],
    queryFn: () =>
      categoriesApi.listCategories(contextId!, {
        type: tx?.type === 'income' ? 'income' : 'expense',
      }),
    enabled:
      Boolean(contextId) &&
      Boolean(tx) &&
      tx?.type !== 'transfer' &&
      (entryOpen || Boolean(tx)),
  })

  const goalsQuery = useQuery({
    queryKey: ['goals', contextId],
    queryFn: () => goalsApi.listGoals(contextId!),
    enabled: Boolean(contextId) && Boolean(tx?.goal_id),
  })

  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      description: '',
      amount: 0,
      date: '',
      type: 'expense',
      account_id: '',
      category_id: null,
    },
  })

  const moveForm = useForm<MoveFormValues>({
    resolver: zodResolver(moveSchema),
    defaultValues: {
      target_context_id: '',
      target_account_id: '',
      target_category_id: null,
    },
  })

  const targetContextId = moveForm.watch('target_context_id')

  const moveAccountsQuery = useQuery({
    queryKey: ['accounts', targetContextId],
    queryFn: () => accountsApi.listAccounts(targetContextId),
    enabled: Boolean(targetContextId) && moving,
  })

  const moveCategoriesQuery = useQuery({
    queryKey: [
      'categories',
      targetContextId,
      tx?.type === 'income' ? 'income' : 'expense',
    ],
    queryFn: () =>
      categoriesApi.listCategories(targetContextId, {
        type: tx?.type === 'income' ? 'income' : 'expense',
      }),
    enabled:
      Boolean(targetContextId) && moving && tx?.type !== 'transfer',
  })

  useEffect(() => {
    moveForm.setValue('target_account_id', '')
    moveForm.setValue('target_category_id', null)
  }, [targetContextId, moveForm])

  const accountName = useMemo(() => {
    if (!tx) return '—'
    return (
      accountsQuery.data?.find((a) => a.id === tx.account_id)?.name ?? '—'
    )
  }, [tx, accountsQuery.data])

  const categoryName = useMemo(() => {
    if (!tx?.category_id) return '—'
    return (
      categoriesQuery.data?.find((c) => c.id === tx.category_id)?.name ?? '—'
    )
  }, [tx, categoriesQuery.data])

  const goalName = useMemo(() => {
    if (!tx?.goal_id) return null
    return goalsQuery.data?.find((g) => g.id === tx.goal_id)?.name ?? tx.goal_id
  }, [tx, goalsQuery.data])

  async function invalidateMoney() {
    await queryClient.invalidateQueries({ queryKey: ['transactions'] })
    await queryClient.invalidateQueries({ queryKey: ['transaction'] })
    await queryClient.invalidateQueries({ queryKey: ['accounts'] })
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const saveMutation = useMutation({
    mutationFn: (values: EntryFormValues) =>
      transactionsApi.updateTransaction(tx!.context_id, tx!.id, {
        account_id: values.account_id,
        category_id: values.category_id || null,
        description: values.description,
        amount: values.amount,
        type: values.type,
        date: values.date,
      }),
    onSuccess: async () => {
      await invalidateMoney()
      toastSuccess(strings.transactions.updated)
      setEntryOpen(false)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  const moveMutation = useMutation({
    mutationFn: (values: MoveFormValues) =>
      transactionsApi.moveTransaction(tx!.context_id, tx!.id, {
        target_context_id: values.target_context_id,
        target_account_id: values.target_account_id,
        target_category_id: values.target_category_id || null,
      }),
    onSuccess: async (moved) => {
      await invalidateMoney()
      toastSuccess(strings.transactions.moved)
      setMoving(false)
      void navigate(
        `/transactions/${moved.id}?context=${moved.context_id}`,
        { replace: true },
      )
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: () =>
      transactionsApi.deleteTransaction(tx!.context_id, tx!.id),
    onSuccess: async () => {
      await invalidateMoney()
      toastSuccess(strings.transactions.deleted)
      void navigate('/transactions')
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  function openEdit() {
    if (!tx || !canMutateEntry(tx)) return
    form.reset({
      description: tx.description,
      amount: tx.amount,
      date: tx.date,
      type: tx.type === 'transfer' ? 'expense' : tx.type,
      account_id: tx.account_id,
      category_id: tx.category_id,
    })
    setEntryOpen(true)
  }

  function handleDelete() {
    if (!window.confirm(strings.transactions.confirmDelete)) return
    deleteMutation.mutate()
  }

  if (!contextId) {
    return (
      <div className="stack">
        <PageHeader title={strings.transactionDetail.title} />
        <ErrorBanner message={strings.common.consolidatedHint} />
        <Link to="/transactions" className="back-link">
          <ArrowLeft size={16} aria-hidden /> {strings.transactionDetail.back}
        </Link>
      </div>
    )
  }

  if (txQuery.isLoading) {
    return <LoadingBlock label={strings.common.loading} />
  }

  if (txQuery.isError || !tx) {
    return (
      <div className="stack">
        <PageHeader title={strings.transactionDetail.title} />
        <ErrorBanner
          message={
            txQuery.isError
              ? getErrorMessage(txQuery.error)
              : strings.transactionDetail.notFound
          }
        />
        <Link to="/transactions" className="back-link">
          <ArrowLeft size={16} aria-hidden /> {strings.transactionDetail.back}
        </Link>
      </div>
    )
  }

  const isConsolidated = activeScope === CONSOLIDATED
  const editable = !isConsolidated && canMutateEntry(tx)
  const watchedType = form.watch('type')

  return (
    <div className="stack">
      <PageHeader
        title={strings.transactionDetail.title}
        actions={
          !isConsolidated ? (
            <>
              {editable ? (
                <IconButton
                  label={strings.common.edit}
                  icon={Pencil}
                  onClick={openEdit}
                />
              ) : null}
              {editable ? (
                <IconButton
                  label={strings.transactions.move}
                  icon={FolderInput}
                  onClick={() => setMoving(true)}
                />
              ) : null}
              <IconButton
                label={strings.common.delete}
                icon={Trash2}
                variant="danger"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              />
            </>
          ) : null
        }
      />

      <Link to="/transactions" className="back-link">
        <ArrowLeft size={16} aria-hidden /> {strings.transactionDetail.back}
      </Link>

      <Panel>
        <div className="detail-grid">
          <DetailField label={strings.transactions.description}>
            {tx.description}
          </DetailField>
          <DetailField label={strings.transactions.amount}>
            <MoneyValue
              amount={tx.amount}
              direction={transactionDirection(tx)}
            />
          </DetailField>
          <DetailField label={strings.transactions.type}>
            {tx.type === 'transfer'
              ? strings.transactions.types.transfer
              : strings.transactions.types[tx.type]}
          </DetailField>
          <DetailField label={strings.transactions.date}>
            {formatDate(tx.date)}
          </DetailField>
          <DetailField label={strings.transactions.account}>
            <Link to={`/accounts/${tx.account_id}?context=${tx.context_id}`}>
              {accountName}
            </Link>
          </DetailField>
          <DetailField label={strings.transactions.category}>
            {categoryName}
          </DetailField>
          <DetailField label={strings.billCaptures.origin}>
            <OriginBadge origin={tx.origin} />
          </DetailField>
          {tx.bill_id ? (
            <DetailField label={strings.transactionDetail.linkedBill}>
              <Link to="/bills">{strings.transactionDetail.viewBill}</Link>
              <span className="muted small mono"> #{tx.bill_id}</span>
            </DetailField>
          ) : null}
          {goalName ? (
            <DetailField label={strings.transactionDetail.linkedGoal}>
              <Link to="/goals">{goalName}</Link>
            </DetailField>
          ) : null}
          {tx.card_invoice_id ? (
            <DetailField label={strings.transactionDetail.linkedInvoice}>
              <Link to="/credit-cards">
                {strings.transactionDetail.viewInvoice}
              </Link>
              <span className="muted small mono"> #{tx.card_invoice_id}</span>
            </DetailField>
          ) : null}
        </div>

        {tx.transfer ? (
          <div className="transfer-detail">
            <h3 className="section-title">{strings.transactions.types.transfer}</h3>
            <p>
              <span className="muted">{strings.transactionDetail.transferFrom}: </span>
              {tx.transfer.from.context.name} → {tx.transfer.from.account.name}
            </p>
            <p>
              <span className="muted">{strings.transactionDetail.transferTo}: </span>
              {tx.transfer.to.context.name} → {tx.transfer.to.account.name}
            </p>
          </div>
        ) : null}
      </Panel>

      {entryOpen ? (
        <Modal
          title={strings.transactions.edit}
          onClose={() => setEntryOpen(false)}
        >
          <form
            className="form-grid"
            onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
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
                {(accountsQuery.data ?? []).map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </TextSelect>
            </Field>
            <Field label={strings.transactions.category}>
              <TextSelect
                {...form.register('category_id', {
                  setValueAs: (v: string) => (v === '' ? null : v),
                })}
              >
                <option value="">{strings.common.select}</option>
                {(categoriesQuery.data ?? [])
                  .filter((cat) =>
                    watchedType === 'income'
                      ? cat.type === 'income'
                      : cat.type === 'expense',
                  )
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.parent_id ? `↳ ${cat.name}` : cat.name}
                    </option>
                  ))}
              </TextSelect>
            </Field>
            {saveMutation.isError ? (
              <ErrorBanner message={getErrorMessage(saveMutation.error)} />
            ) : null}
            <div className="form-actions">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEntryOpen(false)}
              >
                {strings.common.cancel}
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {strings.common.save}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {moving ? (
        <Modal
          title={strings.transactions.moveTitle}
          onClose={() => setMoving(false)}
        >
          <p className="muted small">
            {tx.description} · {formatMoney(tx.amount)}
          </p>
          <form
            className="form-grid"
            onSubmit={moveForm.handleSubmit((values) =>
              moveMutation.mutate(values),
            )}
          >
            <Field
              label={strings.transactions.targetContext}
              error={moveForm.formState.errors.target_context_id?.message}
            >
              <TextSelect {...moveForm.register('target_context_id')}>
                <option value="">{strings.common.select}</option>
                {contexts
                  .filter((ctx) => ctx.id !== tx.context_id)
                  .map((ctx) => (
                    <option key={ctx.id} value={ctx.id}>
                      {ctx.name}
                    </option>
                  ))}
              </TextSelect>
            </Field>
            <Field
              label={strings.transactions.targetAccount}
              error={moveForm.formState.errors.target_account_id?.message}
            >
              <TextSelect {...moveForm.register('target_account_id')}>
                <option value="">{strings.common.select}</option>
                {(moveAccountsQuery.data ?? []).map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </TextSelect>
            </Field>
            <Field label={strings.transactions.category}>
              <TextSelect
                {...moveForm.register('target_category_id', {
                  setValueAs: (v: string) => (v === '' ? null : v),
                })}
              >
                <option value="">{strings.common.select}</option>
                {(moveCategoriesQuery.data ?? []).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.parent_id ? `↳ ${cat.name}` : cat.name}
                  </option>
                ))}
              </TextSelect>
            </Field>
            {moveMutation.isError ? (
              <ErrorBanner message={getErrorMessage(moveMutation.error)} />
            ) : null}
            <div className="form-actions">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setMoving(false)}
              >
                {strings.common.cancel}
              </Button>
              <Button type="submit" disabled={moveMutation.isPending}>
                {strings.transactions.move}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  )
}

function DetailField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="detail-field">
      <span className="detail-field__label muted">{label}</span>
      <div className="detail-field__value">{children}</div>
    </div>
  )
}
