import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { billsApi, categoriesApi } from '@/api'
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
  LoadingBlock,
  Modal,
  PageHeader,
  TextInput,
  TextSelect,
} from '@/components/ui'
import type { Bill, MoneyDirection } from '@/types/models'

const ALL_PERIODS = 'all'

const schema = z.object({
  description: z.string().min(1, strings.common.required),
  amount: z.coerce.number().positive(),
  due_date: z.string().min(1, strings.common.required),
  kind: z.enum(['payable', 'receivable']),
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled']),
  category_id: z.string().nullable(),
  barcode: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

function categoryTypeForBillKind(
  kind: FormValues['kind'],
): MoneyDirection {
  return kind === 'receivable' ? 'income' : 'expense'
}

const emptyValues: FormValues = {
  description: '',
  amount: 0,
  due_date: '',
  kind: 'payable',
  status: 'pending',
  category_id: null,
  barcode: '',
}

export function BillsPage() {
  const queryClient = useQueryClient()
  const activeScope = useAuthStore((s) => s.activeScope)
  const contextId = useWritableContextId()
  const [editing, setEditing] = useState<Bill | null>(null)
  const [open, setOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [period, setPeriod] = useState(currentMonthKey)
  const listContextId = activeScope === CONSOLIDATED ? null : activeScope
  const isEdit = editing !== null

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['bills', listContextId],
    queryFn: () => billsApi.listBills(listContextId!),
    enabled: Boolean(listContextId),
  })

  const periodOptions = useMemo(() => {
    const months = new Set<string>([currentMonthKey()])
    for (const bill of data) {
      if (bill.due_date.length >= 7) months.add(bill.due_date.slice(0, 7))
    }
    return [...months].sort((a, b) => b.localeCompare(a))
  }, [data])

  const filtered = useMemo(() => {
    if (period === ALL_PERIODS) return data
    return data.filter((bill) => isInMonth(bill.due_date, period))
  }, [data, period])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  })

  const watchedKind = form.watch('kind')
  const categoryType = categoryTypeForBillKind(watchedKind)

  useEffect(() => {
    if (!isEdit) {
      form.setValue('category_id', null)
    }
  }, [watchedKind, form, isEdit])

  const categoriesQuery = useQuery({
    queryKey: ['categories', contextId, categoryType],
    queryFn: () =>
      categoriesApi.listCategories(contextId!, { type: categoryType }),
    enabled: Boolean(contextId) && open,
  })

  function openCreate() {
    setEditing(null)
    form.reset(emptyValues)
    setOpen(true)
  }

  function openEdit(bill: Bill) {
    setEditing(bill)
    form.reset({
      description: bill.description,
      amount: bill.amount,
      due_date: bill.due_date,
      kind: bill.kind,
      status: bill.status,
      category_id: bill.category_id,
      barcode: bill.barcode ?? '',
    })
    setOpen(true)
  }

  function closeModal() {
    setOpen(false)
    setEditing(null)
    form.reset(emptyValues)
  }

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (isEdit && editing) {
        return billsApi.updateBill(contextId!, editing.id, {
          description: values.description,
          amount: values.amount,
          due_date: values.due_date,
          category_id: values.category_id || null,
          barcode: values.barcode || null,
        })
      }
      return billsApi.createBill(contextId!, {
        description: values.description,
        amount: values.amount,
        due_date: values.due_date,
        kind: values.kind,
        status: values.status,
        category_id: values.category_id || null,
        barcode: values.barcode || null,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bills'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toastSuccess(isEdit ? strings.bills.updated : strings.bills.created)
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (billId: string) => billsApi.deleteBill(contextId!, billId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bills'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toastSuccess(strings.bills.deleted)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  function handleDelete(billId: string) {
    if (!window.confirm(strings.bills.confirmDelete)) return
    deleteMutation.mutate(billId)
  }

  const categories = categoriesQuery.data ?? []

  return (
    <div className="stack">
      <PageHeader
        title={strings.bills.title}
        actions={
          <Button
            onClick={openCreate}
            disabled={!contextId || activeScope === CONSOLIDATED}
          >
            {strings.bills.create}
          </Button>
        }
      />

      {activeScope === CONSOLIDATED ? (
        <ErrorBanner message="Selecione um contexto para cadastrar e listar boletos." />
      ) : null}

      {listContextId ? (
        <div className="filter-bar">
          <Field label={strings.bills.period}>
            <TextSelect
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
            >
              <option value={ALL_PERIODS}>{strings.bills.periodAll}</option>
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
        <EmptyState message={strings.bills.empty} />
      ) : null}

      {!isLoading &&
      listContextId &&
      data.length > 0 &&
      filtered.length === 0 ? (
        <EmptyState message={strings.bills.emptyMonth} />
      ) : null}

      {filtered.length > 0 ? (
        <DataTable
          headers={[
            strings.bills.description,
            strings.bills.amount,
            strings.bills.dueDate,
            strings.bills.kind,
            strings.bills.status,
            strings.common.actions,
          ]}
        >
          {filtered.map((bill) => (
            <tr key={bill.id}>
              <td>{bill.description}</td>
              <td className="mono">{formatMoney(bill.amount)}</td>
              <td>{formatDate(bill.due_date)}</td>
              <td>{strings.bills.kinds[bill.kind]}</td>
              <td>{strings.bills.statuses[bill.status]}</td>
              <td className="actions-cell">
                <Button
                  variant="ghost"
                  onClick={() => openEdit(bill)}
                  disabled={!contextId}
                >
                  {strings.common.edit}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleDelete(bill.id)}
                  disabled={deleteMutation.isPending || !contextId}
                >
                  {strings.common.delete}
                </Button>
              </td>
            </tr>
          ))}
        </DataTable>
      ) : null}

      {open && contextId ? (
        <Modal
          title={isEdit ? strings.bills.edit : strings.bills.create}
          onClose={closeModal}
        >
          <form
            className="form-grid"
            onSubmit={form.handleSubmit((values) =>
              mutation.mutateAsync(values),
            )}
          >
            <Field
              label={strings.bills.description}
              error={form.formState.errors.description?.message}
            >
              <TextInput {...form.register('description')} />
            </Field>
            <Field
              label={strings.bills.amount}
              error={form.formState.errors.amount?.message}
            >
              <TextInput type="number" step="0.01" {...form.register('amount')} />
            </Field>
            <Field
              label={strings.bills.dueDate}
              error={form.formState.errors.due_date?.message}
            >
              <TextInput type="date" {...form.register('due_date')} />
            </Field>
            {!isEdit ? (
              <>
                <Field label={strings.bills.kind}>
                  <TextSelect {...form.register('kind')}>
                    <option value="payable">{strings.bills.kinds.payable}</option>
                    <option value="receivable">
                      {strings.bills.kinds.receivable}
                    </option>
                  </TextSelect>
                </Field>
                <Field label={strings.bills.status}>
                  <TextSelect {...form.register('status')}>
                    {(
                      Object.keys(strings.bills.statuses) as Array<
                        keyof typeof strings.bills.statuses
                      >
                    ).map((key) => (
                      <option key={key} value={key}>
                        {strings.bills.statuses[key]}
                      </option>
                    ))}
                  </TextSelect>
                </Field>
              </>
            ) : (
              <p className="muted small">
                {strings.bills.kinds[editing.kind]} ·{' '}
                {strings.bills.statuses[editing.status]}
              </p>
            )}
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
            <Field label={strings.bills.barcode}>
              <TextInput {...form.register('barcode')} />
            </Field>
            {mutation.isError ? (
              <ErrorBanner message={getErrorMessage(mutation.error)} />
            ) : null}
            <div className="form-actions">
              <Button type="button" variant="ghost" onClick={closeModal}>
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
          defaultType={categoryType}
          onCreated={(categoryId) => form.setValue('category_id', categoryId)}
        />
      ) : null}
    </div>
  )
}
