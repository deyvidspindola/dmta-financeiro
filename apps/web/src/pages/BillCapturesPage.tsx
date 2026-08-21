import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { billCapturesApi, categoriesApi } from '@/api'
import { OriginBadge } from '@/components/OriginBadge'
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
import { strings } from '@/i18n/pt-BR'
import { formatDate, formatMoney } from '@/lib/format'
import { getErrorMessage } from '@/lib/errors'
import { useAuthStore, CONSOLIDATED } from '@/store/authStore'
import { toastError, toastSuccess } from '@/store/toastStore'
import type { BillCapture, BillKind, MoneyDirection } from '@/types/models'
import type { BillCaptureListStatus } from '@/api/billCaptures'

const schema = z.object({
  context_id: z.string().min(1, strings.common.required),
  description: z.string().min(1, strings.common.required),
  amount: z.coerce.number().positive(),
  due_date: z.string().min(1, strings.common.required),
  direction: z.enum(['payable', 'receivable']),
  category_id: z.string().nullable(),
  beneficiary: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

function categoryTypeForDirection(direction: BillKind): MoneyDirection {
  return direction === 'receivable' ? 'income' : 'expense'
}

export function BillCapturesPage() {
  const queryClient = useQueryClient()
  const contexts = useAuthStore((s) => s.contexts)
  const activeScope = useAuthStore((s) => s.activeScope)
  const [statusFilter, setStatusFilter] =
    useState<BillCaptureListStatus>('pending')
  const [confirming, setConfirming] = useState<BillCapture | null>(null)
  const [categoryOpen, setCategoryOpen] = useState(false)

  const orderedContexts = [...contexts].sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name, 'pt-BR')
    return a.type === 'pf' ? -1 : 1
  })

  const defaultContextId =
    activeScope !== CONSOLIDATED &&
    contexts.some((c) => c.id === activeScope)
      ? activeScope
      : (orderedContexts[0]?.id ?? '')

  const listQuery = useQuery({
    queryKey: ['bill-captures', statusFilter],
    queryFn: () => billCapturesApi.listBillCaptures(statusFilter),
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      context_id: defaultContextId,
      description: '',
      amount: 0,
      due_date: '',
      direction: 'payable',
      category_id: null,
      beneficiary: '',
    },
  })

  const watchedDirection = form.watch('direction')
  const watchedContextId = form.watch('context_id')
  const categoryType = categoryTypeForDirection(watchedDirection)

  useEffect(() => {
    form.setValue('category_id', null)
  }, [watchedDirection, watchedContextId, form])

  const categoriesQuery = useQuery({
    queryKey: ['categories', watchedContextId, categoryType],
    queryFn: () =>
      categoriesApi.listCategories(watchedContextId, { type: categoryType }),
    enabled: Boolean(confirming) && Boolean(watchedContextId),
  })

  function openConfirm(capture: BillCapture) {
    setConfirming(capture)
    form.reset({
      context_id: defaultContextId,
      description: capture.beneficiary?.trim() || '',
      amount: capture.amount ?? 0,
      due_date: capture.due_date ?? '',
      direction: 'payable',
      category_id: null,
      beneficiary: capture.beneficiary ?? '',
    })
  }

  function closeConfirm() {
    setConfirming(null)
    setCategoryOpen(false)
  }

  const confirmMutation = useMutation({
    mutationFn: (values: FormValues) =>
      billCapturesApi.confirmBillCapture(confirming!.id, {
        context_id: values.context_id,
        description: values.description,
        amount: values.amount,
        due_date: values.due_date,
        direction: values.direction,
        category_id: values.category_id || null,
        beneficiary: values.beneficiary || null,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bill-captures'] })
      await queryClient.invalidateQueries({ queryKey: ['bills'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toastSuccess(strings.billCaptures.confirmed)
      closeConfirm()
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (captureId: string) =>
      billCapturesApi.rejectBillCapture(captureId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bill-captures'] })
      toastSuccess(strings.billCaptures.rejected)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  function handleReject(captureId: string) {
    if (!window.confirm(strings.billCaptures.confirmReject)) return
    rejectMutation.mutate(captureId)
  }

  const rows = listQuery.data ?? []
  const categories = categoriesQuery.data ?? []

  return (
    <div className="stack">
      <PageHeader
        title={strings.billCaptures.title}
        description={strings.billCaptures.hint}
      />

      <div className="filter-bar">
        <Field label={strings.billCaptures.statusFilter}>
          <TextSelect
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as BillCaptureListStatus)
            }
          >
            <option value="pending">{strings.billCaptures.statuses.pending}</option>
            <option value="confirmed">
              {strings.billCaptures.statuses.confirmed}
            </option>
            <option value="rejected">
              {strings.billCaptures.statuses.rejected}
            </option>
            <option value="all">{strings.billCaptures.statuses.all}</option>
          </TextSelect>
        </Field>
      </div>

      {listQuery.isLoading ? (
        <LoadingBlock label={strings.common.loading} />
      ) : null}
      {listQuery.isError ? (
        <ErrorBanner message={getErrorMessage(listQuery.error)} />
      ) : null}

      {!listQuery.isLoading && rows.length === 0 ? (
        <EmptyState message={strings.billCaptures.empty} />
      ) : null}

      {rows.length > 0 ? (
        <DataTable
          headers={[
            strings.billCaptures.origin,
            strings.billCaptures.linhaDigitavel,
            strings.bills.amount,
            strings.bills.dueDate,
            strings.billCaptures.beneficiary,
            strings.common.actions,
          ]}
        >
          {rows.map((capture) => (
            <tr key={capture.id}>
              <td>
                <OriginBadge origin={capture.origin} />
              </td>
              <td className="mono wrap">
                {capture.linha_digitavel ?? (
                  <span className="muted">
                    {strings.billCaptures.linhaMissing}
                  </span>
                )}
              </td>
              <td className="mono">
                {capture.amount === null
                  ? '—'
                  : formatMoney(capture.amount)}
              </td>
              <td>
                {capture.due_date ? formatDate(capture.due_date) : '—'}
              </td>
              <td>{capture.beneficiary ?? '—'}</td>
              <td className="actions-cell">
                {capture.status === 'pending' ? (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => openConfirm(capture)}
                    >
                      {strings.billCaptures.confirm}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleReject(capture.id)}
                      disabled={rejectMutation.isPending}
                    >
                      {strings.billCaptures.reject}
                    </Button>
                  </>
                ) : (
                  <span className="muted small">
                    {strings.billCaptures.statuses[capture.status]}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      ) : null}

      {confirming ? (
        <Modal title={strings.billCaptures.confirmTitle} onClose={closeConfirm}>
          <p className="muted small bill-capture-preview">
            <OriginBadge origin={confirming.origin} />
            {confirming.linha_digitavel ? (
              <span className="mono wrap">{confirming.linha_digitavel}</span>
            ) : (
              <span>{strings.billCaptures.linhaMissing}</span>
            )}
          </p>
          <form
            className="form-grid"
            onSubmit={form.handleSubmit((values) =>
              confirmMutation.mutateAsync(values),
            )}
          >
            <Field
              label={strings.nav.context}
              error={form.formState.errors.context_id?.message}
            >
              <TextSelect {...form.register('context_id')}>
                <option value="">{strings.common.select}</option>
                {orderedContexts.map((ctx) => (
                  <option key={ctx.id} value={ctx.id}>
                    {ctx.name}
                  </option>
                ))}
              </TextSelect>
            </Field>
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
              <TextInput
                type="number"
                step="0.01"
                {...form.register('amount')}
              />
            </Field>
            <Field
              label={strings.bills.dueDate}
              error={form.formState.errors.due_date?.message}
            >
              <TextInput type="date" {...form.register('due_date')} />
            </Field>
            <Field label={strings.bills.kind}>
              <TextSelect {...form.register('direction')}>
                <option value="payable">{strings.bills.kinds.payable}</option>
                <option value="receivable">
                  {strings.bills.kinds.receivable}
                </option>
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
                  disabled={!watchedContextId}
                >
                  {strings.categories.quickAdd}
                </Button>
              </div>
            </Field>
            <Field label={strings.billCaptures.beneficiary}>
              <TextInput {...form.register('beneficiary')} />
            </Field>
            {confirmMutation.isError ? (
              <ErrorBanner message={getErrorMessage(confirmMutation.error)} />
            ) : null}
            <div className="form-actions">
              <Button type="button" variant="ghost" onClick={closeConfirm}>
                {strings.common.cancel}
              </Button>
              <Button type="submit" disabled={confirmMutation.isPending}>
                {strings.billCaptures.confirm}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {confirming && watchedContextId ? (
        <CategoryModal
          contextId={watchedContextId}
          open={categoryOpen}
          onClose={() => setCategoryOpen(false)}
          defaultType={categoryType}
          onCreated={(categoryId) => form.setValue('category_id', categoryId)}
        />
      ) : null}
    </div>
  )
}
