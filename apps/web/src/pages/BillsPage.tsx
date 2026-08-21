import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { billsApi, categoriesApi } from '@/api'
import { strings } from '@/i18n/pt-BR'
import { formatDate, formatMoney } from '@/lib/format'
import { getErrorMessage } from '@/lib/errors'
import { useWritableContextId } from '@/hooks/useWritableContextId'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'
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
import type { MoneyDirection } from '@/types/models'

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

export function BillsPage() {
  const queryClient = useQueryClient()
  const activeScope = useAuthStore((s) => s.activeScope)
  const contextId = useWritableContextId()
  const [open, setOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const listContextId = activeScope === CONSOLIDATED ? null : activeScope

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['bills', listContextId],
    queryFn: () => billsApi.listBills(listContextId!),
    enabled: Boolean(listContextId),
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: '',
      amount: 0,
      due_date: '',
      kind: 'payable',
      status: 'pending',
      category_id: null,
      barcode: '',
    },
  })

  const watchedKind = form.watch('kind')
  const categoryType = categoryTypeForBillKind(watchedKind)

  useEffect(() => {
    form.setValue('category_id', null)
  }, [watchedKind, form])

  const categoriesQuery = useQuery({
    queryKey: ['categories', contextId, categoryType],
    queryFn: () =>
      categoriesApi.listCategories(contextId!, { type: categoryType }),
    enabled: Boolean(contextId) && open,
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      billsApi.createBill(contextId!, {
        description: values.description,
        amount: values.amount,
        due_date: values.due_date,
        kind: values.kind,
        status: values.status,
        category_id: values.category_id || null,
        barcode: values.barcode || null,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bills'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setOpen(false)
      form.reset()
    },
  })

  const categories = categoriesQuery.data ?? []

  return (
    <div className="stack">
      <PageHeader
        title={strings.bills.title}
        actions={
          <Button
            onClick={() => setOpen(true)}
            disabled={!contextId || activeScope === CONSOLIDATED}
          >
            {strings.bills.create}
          </Button>
        }
      />

      {activeScope === CONSOLIDATED ? (
        <ErrorBanner message="Selecione um contexto para cadastrar e listar boletos." />
      ) : null}

      {isLoading ? <LoadingBlock label={strings.common.loading} /> : null}
      {isError ? <ErrorBanner message={strings.common.error} /> : null}

      {!isLoading && listContextId && data.length === 0 ? (
        <EmptyState message={strings.bills.empty} />
      ) : null}

      {data.length > 0 ? (
        <DataTable
          headers={[
            strings.bills.description,
            strings.bills.amount,
            strings.bills.dueDate,
            strings.bills.kind,
            strings.bills.status,
          ]}
        >
          {data.map((bill) => (
            <tr key={bill.id}>
              <td>{bill.description}</td>
              <td className="mono">{formatMoney(bill.amount)}</td>
              <td>{formatDate(bill.due_date)}</td>
              <td>{strings.bills.kinds[bill.kind]}</td>
              <td>{strings.bills.statuses[bill.status]}</td>
            </tr>
          ))}
        </DataTable>
      ) : null}

      {open && contextId ? (
        <Modal title={strings.bills.create} onClose={() => setOpen(false)}>
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
          defaultType={categoryType}
          onCreated={(categoryId) => form.setValue('category_id', categoryId)}
        />
      ) : null}
    </div>
  )
}
