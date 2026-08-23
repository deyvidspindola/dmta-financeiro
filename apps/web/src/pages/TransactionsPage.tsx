import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftRight, FolderInput, Pencil, Trash2 } from 'lucide-react'
import { z } from 'zod'
import {
  accountsApi,
  categoriesApi,
  consolidatedApi,
  transactionsApi,
  transfersApi,
} from '@/api'
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
  MoneyValue,
  PageHeader,
  TextInput,
  TextSelect,
} from '@/components/ui'
import type { StatementEntry } from '@/types/models'

const ALL_PERIODS = 'all'

const entrySchema = z.object({
  description: z.string().min(1, strings.common.required),
  amount: z.coerce.number().positive(),
  date: z.string().min(1, strings.common.required),
  type: z.enum(['income', 'expense']),
  account_id: z.string().min(1, strings.common.required),
  category_id: z.string().nullable(),
})

const transferSchema = z
  .object({
    from_account_id: z.string().min(1, strings.common.required),
    to_account_id: z.string().min(1, strings.common.required),
    to_context_id: z.string().min(1, strings.common.required),
    amount: z.coerce.number().positive(),
    description: z.string().min(1, strings.common.required),
    occurred_at: z.string().min(1, strings.common.required),
  })
  .refine((v) => v.from_account_id !== v.to_account_id, {
    message: strings.transfers.sameAccount,
    path: ['to_account_id'],
  })

const moveSchema = z.object({
  target_context_id: z.string().min(1, strings.common.required),
  target_account_id: z.string().min(1, strings.common.required),
  target_category_id: z.string().nullable(),
})

type EntryFormValues = z.infer<typeof entrySchema>
type TransferFormValues = z.infer<typeof transferSchema>
type MoveFormValues = z.infer<typeof moveSchema>

function canMutateEntry(tx: StatementEntry): boolean {
  return !tx.transfer_pair_id && !tx.bill_id && tx.type !== 'transfer'
}

/**
 * Crédito (entrada) ou débito (saída) pra colorir o valor na listagem.
 * Transferência não tem um `type` próprio pra cada perna — o mesmo
 * critério do backend decide: a perna de menor id é a origem (débito),
 * ver `StatementEntry::isTransferOrigin()` na API.
 */
function transactionDirection(tx: StatementEntry): 'credit' | 'debit' {
  if (tx.type === 'income') return 'credit'
  if (tx.type === 'expense') return 'debit'
  return tx.transfer_pair_id && Number(tx.id) < Number(tx.transfer_pair_id)
    ? 'debit'
    : 'credit'
}

const emptyEntry: EntryFormValues = {
  description: '',
  amount: 0,
  date: new Date().toISOString().slice(0, 10),
  type: 'expense',
  account_id: '',
  category_id: null,
}

export function TransactionsPage() {
  const queryClient = useQueryClient()
  const activeScope = useAuthStore((s) => s.activeScope)
  const contexts = useAuthStore((s) => s.contexts)
  const contextId = useWritableContextId()
  const isConsolidated = activeScope === CONSOLIDATED

  const [period, setPeriod] = useState(currentMonthKey)
  const [entryOpen, setEntryOpen] = useState(false)
  const [editing, setEditing] = useState<StatementEntry | null>(null)
  const [transferOpen, setTransferOpen] = useState(false)
  const [moving, setMoving] = useState<StatementEntry | null>(null)
  const [categoryOpen, setCategoryOpen] = useState(false)

  const isEdit = editing !== null

  const listQuery = useQuery({
    queryKey: ['transactions', activeScope],
    queryFn: () =>
      isConsolidated
        ? consolidatedApi.listConsolidatedTransactions()
        : transactionsApi.listTransactions(activeScope),
    enabled: isConsolidated || Boolean(activeScope),
  })

  const data = listQuery.data ?? []

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

  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: emptyEntry,
  })

  const transferForm = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      from_account_id: '',
      to_account_id: '',
      to_context_id: '',
      amount: 0,
      description: '',
      occurred_at: new Date().toISOString().slice(0, 10),
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

  const watchedType = form.watch('type')
  const targetContextId = moveForm.watch('target_context_id')
  const transferToContextId = transferForm.watch('to_context_id')

  useEffect(() => {
    if (!isEdit) form.setValue('category_id', null)
  }, [watchedType, form, isEdit])

  useEffect(() => {
    moveForm.setValue('target_account_id', '')
    moveForm.setValue('target_category_id', null)
  }, [targetContextId, moveForm])

  useEffect(() => {
    transferForm.setValue('to_account_id', '')
  }, [transferToContextId, transferForm])

  const accountsQuery = useQuery({
    queryKey: ['accounts', contextId],
    queryFn: () => accountsApi.listAccounts(contextId!),
    enabled:
      Boolean(contextId) && (entryOpen || transferOpen) && !isConsolidated,
  })

  const categoriesQuery = useQuery({
    queryKey: ['categories', contextId, watchedType],
    queryFn: () =>
      categoriesApi.listCategories(contextId!, { type: watchedType }),
    enabled: Boolean(contextId) && entryOpen && !isConsolidated,
  })

  const moveAccountsQuery = useQuery({
    queryKey: ['accounts', targetContextId],
    queryFn: () => accountsApi.listAccounts(targetContextId),
    enabled: Boolean(targetContextId) && Boolean(moving),
  })

  // Contas do contexto de destino da transferência — quando igual ao de
  // origem, reaproveita o cache de `accountsQuery` (mesma queryKey).
  // Permite transferir entre contextos diferentes (PF ⇄ empresa), não só
  // entre contas do mesmo contexto.
  const transferToAccountsQuery = useQuery({
    queryKey: ['accounts', transferToContextId],
    queryFn: () => accountsApi.listAccounts(transferToContextId),
    enabled: Boolean(transferToContextId) && transferOpen,
  })

  const moveCategoriesQuery = useQuery({
    queryKey: [
      'categories',
      targetContextId,
      moving?.type === 'income' ? 'income' : 'expense',
    ],
    queryFn: () =>
      categoriesApi.listCategories(targetContextId, {
        type: moving?.type === 'income' ? 'income' : 'expense',
      }),
    enabled:
      Boolean(targetContextId) &&
      Boolean(moving) &&
      moving?.type !== 'transfer',
  })

  function openCreate() {
    setEditing(null)
    form.reset(emptyEntry)
    setEntryOpen(true)
  }

  function openEdit(tx: StatementEntry) {
    if (!canMutateEntry(tx)) return
    setEditing(tx)
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

  function closeEntry() {
    setEntryOpen(false)
    setEditing(null)
    form.reset(emptyEntry)
  }

  function openTransfer() {
    transferForm.reset({
      from_account_id: '',
      to_account_id: '',
      to_context_id: contextId ?? '',
      amount: 0,
      description: '',
      occurred_at: new Date().toISOString().slice(0, 10),
    })
    setTransferOpen(true)
  }

  function openMove(tx: StatementEntry) {
    if (!canMutateEntry(tx)) return
    setMoving(tx)
    moveForm.reset({
      target_context_id: '',
      target_account_id: '',
      target_category_id: null,
    })
  }

  async function invalidateMoney() {
    await queryClient.invalidateQueries({ queryKey: ['transactions'] })
    await queryClient.invalidateQueries({ queryKey: ['accounts'] })
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const saveMutation = useMutation({
    mutationFn: (values: EntryFormValues) => {
      const payload = {
        ...values,
        category_id: values.category_id || null,
      }
      if (isEdit && editing) {
        return transactionsApi.updateTransaction(
          editing.context_id,
          editing.id,
          payload,
        )
      }
      return transactionsApi.createTransaction(contextId!, payload)
    },
    onSuccess: async () => {
      await invalidateMoney()
      toastSuccess(
        isEdit
          ? strings.transactions.updated
          : strings.transactions.created,
      )
      closeEntry()
    },
  })

  const transferMutation = useMutation({
    mutationFn: (values: TransferFormValues) =>
      transfersApi.createTransfer(contextId!, values),
    onSuccess: async () => {
      await invalidateMoney()
      toastSuccess(strings.transfers.created)
      setTransferOpen(false)
      transferForm.reset({
        from_account_id: '',
        to_account_id: '',
        to_context_id: contextId ?? '',
        amount: 0,
        description: '',
        occurred_at: new Date().toISOString().slice(0, 10),
      })
    },
  })

  const moveMutation = useMutation({
    mutationFn: (values: MoveFormValues) =>
      transactionsApi.moveTransaction(moving!.context_id, moving!.id, {
        target_context_id: values.target_context_id,
        target_account_id: values.target_account_id,
        target_category_id: values.target_category_id || null,
      }),
    onSuccess: async () => {
      await invalidateMoney()
      toastSuccess(strings.transactions.moved)
      setMoving(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (tx: StatementEntry) =>
      transactionsApi.deleteTransaction(tx.context_id, tx.id),
    onSuccess: async () => {
      await invalidateMoney()
      toastSuccess(strings.transactions.deleted)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  function handleDelete(tx: StatementEntry) {
    if (!window.confirm(strings.transactions.confirmDelete)) return
    deleteMutation.mutate(tx)
  }

  const accounts = accountsQuery.data ?? []
  const categories = categoriesQuery.data ?? []
  const moveAccounts = moveAccountsQuery.data ?? []
  const moveCategories = moveCategoriesQuery.data ?? []
  const transferToAccounts = transferToAccountsQuery.data ?? []
  const otherContexts = contexts.filter(
    (c) => !moving || c.id !== moving.context_id,
  )

  const headers = [
    ...(isConsolidated ? [strings.common.context] : []),
    strings.transactions.date,
    strings.transactions.description,
    strings.transactions.type,
    strings.transactions.amount,
    strings.common.actions,
  ]

  return (
    <div className="stack">
      <PageHeader
        title={strings.transactions.title}
        actions={
          <>
            <Button
              variant="ghost"
              onClick={openTransfer}
              disabled={!contextId || isConsolidated}
            >
              {strings.transfers.create}
            </Button>
            <Button
              onClick={openCreate}
              disabled={!contextId || isConsolidated}
            >
              {strings.transactions.create}
            </Button>
          </>
        }
      />

      {isConsolidated ? (
        <p className="muted small">{strings.common.consolidatedHint}</p>
      ) : null}

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

      {listQuery.isLoading ? (
        <LoadingBlock label={strings.common.loading} />
      ) : null}
      {listQuery.isError ? (
        <ErrorBanner message={getErrorMessage(listQuery.error)} />
      ) : null}

      {!listQuery.isLoading && data.length === 0 ? (
        <EmptyState message={strings.transactions.empty} />
      ) : null}

      {!listQuery.isLoading && data.length > 0 && filtered.length === 0 ? (
        <EmptyState message={strings.transactions.emptyMonth} />
      ) : null}

      {filtered.length > 0 ? (
        <DataTable headers={headers}>
          {filtered.map((tx) => (
            <tr key={`${tx.context_id}-${tx.id}`}>
              {isConsolidated ? (
                <td>{tx.context?.name ?? '—'}</td>
              ) : null}
              <td>{formatDate(tx.date)}</td>
              <td>
                {tx.description}
                {tx.recurring_transaction_id ? (
                  <span className="muted small"> · recorrente</span>
                ) : null}
              </td>
              <td>
                {tx.type === 'transfer'
                  ? strings.transactions.types.transfer
                  : strings.transactions.types[tx.type]}
              </td>
              <td>
                <MoneyValue
                  amount={tx.amount}
                  direction={transactionDirection(tx)}
                />
              </td>
              <td className="actions-cell">
                {!isConsolidated && canMutateEntry(tx) ? (
                  <>
                    <IconButton
                      label={strings.common.edit}
                      icon={Pencil}
                      onClick={() => openEdit(tx)}
                    />
                    <IconButton
                      label={strings.transactions.move}
                      icon={FolderInput}
                      onClick={() => openMove(tx)}
                    />
                  </>
                ) : null}
                {!isConsolidated ? (
                  <IconButton
                    label={strings.common.delete}
                    icon={Trash2}
                    variant="danger"
                    onClick={() => handleDelete(tx)}
                    disabled={deleteMutation.isPending}
                  />
                ) : null}
              </td>
            </tr>
          ))}
        </DataTable>
      ) : null}

      {entryOpen && contextId ? (
        <Modal
          title={
            isEdit ? strings.transactions.edit : strings.transactions.create
          }
          onClose={closeEntry}
        >
          <form
            className="form-grid"
            onSubmit={form.handleSubmit((values) =>
              saveMutation.mutateAsync(values),
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
              <TextInput
                type="number"
                step="0.01"
                {...form.register('amount')}
              />
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
            <Field label={strings.transactions.category}>
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
            {saveMutation.isError ? (
              <ErrorBanner message={getErrorMessage(saveMutation.error)} />
            ) : null}
            <div className="form-actions">
              <Button type="button" variant="ghost" onClick={closeEntry}>
                {strings.common.cancel}
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {strings.common.save}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {transferOpen && contextId ? (
        <Modal
          title={strings.transfers.create}
          onClose={() => setTransferOpen(false)}
        >
          <form
            className="form-grid"
            onSubmit={transferForm.handleSubmit((values) =>
              transferMutation.mutateAsync(values),
            )}
          >
            <Field
              label={strings.transfers.from}
              error={transferForm.formState.errors.from_account_id?.message}
            >
              <TextSelect {...transferForm.register('from_account_id')}>
                <option value="">{strings.common.select}</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </TextSelect>
            </Field>
            <Field
              label={strings.transfers.toContext}
              error={transferForm.formState.errors.to_context_id?.message}
            >
              <TextSelect {...transferForm.register('to_context_id')}>
                {contexts.map((ctx) => (
                  <option key={ctx.id} value={ctx.id}>
                    {ctx.name}
                  </option>
                ))}
              </TextSelect>
            </Field>
            <Field
              label={strings.transfers.to}
              error={transferForm.formState.errors.to_account_id?.message}
            >
              <TextSelect {...transferForm.register('to_account_id')}>
                <option value="">{strings.common.select}</option>
                {transferToAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </TextSelect>
            </Field>
            <Field
              label={strings.transactions.amount}
              error={transferForm.formState.errors.amount?.message}
            >
              <TextInput
                type="number"
                step="0.01"
                {...transferForm.register('amount')}
              />
            </Field>
            <Field
              label={strings.transactions.description}
              error={transferForm.formState.errors.description?.message}
            >
              <TextInput {...transferForm.register('description')} />
            </Field>
            <Field
              label={strings.transactions.date}
              error={transferForm.formState.errors.occurred_at?.message}
            >
              <TextInput
                type="date"
                {...transferForm.register('occurred_at')}
              />
            </Field>
            {transferMutation.isError ? (
              <ErrorBanner message={getErrorMessage(transferMutation.error)} />
            ) : null}
            <div className="form-actions">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setTransferOpen(false)}
              >
                {strings.common.cancel}
              </Button>
              <Button type="submit" disabled={transferMutation.isPending}>
                <ArrowLeftRight size={16} aria-hidden />{' '}
                {strings.common.save}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {moving ? (
        <Modal
          title={strings.transactions.moveTitle}
          onClose={() => setMoving(null)}
        >
          <p className="muted small">
            {moving.description} · {formatMoney(moving.amount)}
          </p>
          <form
            className="form-grid"
            onSubmit={moveForm.handleSubmit((values) =>
              moveMutation.mutateAsync(values),
            )}
          >
            <Field
              label={strings.transactions.targetContext}
              error={moveForm.formState.errors.target_context_id?.message}
            >
              <TextSelect {...moveForm.register('target_context_id')}>
                <option value="">{strings.common.select}</option>
                {otherContexts.map((ctx) => (
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
                {moveAccounts.map((account) => (
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
                {moveCategories.map((cat) => (
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
                onClick={() => setMoving(null)}
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
