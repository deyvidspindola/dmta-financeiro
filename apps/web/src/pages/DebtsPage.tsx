import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Pencil, Trash2 } from 'lucide-react'
import { z } from 'zod'
import { debtsApi } from '@/api'
import { strings } from '@/i18n/pt-BR'
import { formatDate, formatMoney } from '@/lib/format'
import { getErrorMessage } from '@/lib/errors'
import { useWritableContextId } from '@/hooks/useWritableContextId'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'
import { toastError, toastSuccess } from '@/store/toastStore'
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
import type { Debt } from '@/types/models'

const schema = z.object({
  description: z.string().min(1, strings.common.required),
  amount: z.coerce.number().positive(),
  direction: z.enum(['i_owe', 'owed_to_me']),
  counterparty: z.string().optional(),
  due_date: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const emptyValues: FormValues = {
  description: '',
  amount: 0,
  direction: 'i_owe',
  counterparty: '',
  due_date: '',
  notes: '',
}

export function DebtsPage() {
  const queryClient = useQueryClient()
  const activeScope = useAuthStore((s) => s.activeScope)
  const contextId = useWritableContextId()
  const listContextId = activeScope === CONSOLIDATED ? null : activeScope
  const [editing, setEditing] = useState<Debt | null>(null)
  const [open, setOpen] = useState(false)
  const isEdit = editing !== null

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['debts', listContextId],
    queryFn: () => debtsApi.listDebts(listContextId!),
    enabled: Boolean(listContextId),
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  })

  function openCreate() {
    setEditing(null)
    form.reset(emptyValues)
    setOpen(true)
  }

  function openEdit(item: Debt) {
    setEditing(item)
    form.reset({
      description: item.description,
      amount: item.amount,
      direction: item.direction,
      counterparty: item.counterparty ?? '',
      due_date: item.due_date ?? '',
      notes: item.notes ?? '',
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
        return debtsApi.updateDebt(contextId!, editing.id, {
          description: values.description,
          amount: values.amount,
          counterparty: values.counterparty || null,
          due_date: values.due_date || null,
          notes: values.notes || null,
        })
      }
      return debtsApi.createDebt(contextId!, {
        description: values.description,
        amount: values.amount,
        direction: values.direction,
        counterparty: values.counterparty || null,
        due_date: values.due_date || null,
        notes: values.notes || null,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['debts'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toastSuccess(isEdit ? strings.debts.updated : strings.debts.created)
      closeModal()
    },
  })

  const settleMutation = useMutation({
    mutationFn: (debtId: string) => debtsApi.settleDebt(contextId!, debtId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['debts'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toastSuccess(strings.debts.settled)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (debtId: string) => debtsApi.deleteDebt(contextId!, debtId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['debts'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toastSuccess(strings.debts.deleted)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  function handleSettle(debtId: string) {
    if (!window.confirm(strings.debts.confirmSettle)) return
    settleMutation.mutate(debtId)
  }

  function handleDelete(debtId: string) {
    if (!window.confirm(strings.debts.confirmDelete)) return
    deleteMutation.mutate(debtId)
  }

  return (
    <div className="stack">
      <PageHeader
        title={strings.debts.title}
        description={strings.debts.hint}
        actions={
          <Button
            onClick={openCreate}
            disabled={!contextId || activeScope === CONSOLIDATED}
          >
            {strings.debts.create}
          </Button>
        }
      />

      {activeScope === CONSOLIDATED ? (
        <ErrorBanner message={strings.debts.needContext} />
      ) : null}

      {isLoading ? <LoadingBlock label={strings.common.loading} /> : null}
      {isError ? <ErrorBanner message={strings.common.error} /> : null}

      {!isLoading && listContextId && data.length === 0 ? (
        <EmptyState message={strings.debts.empty} />
      ) : null}

      {data.length > 0 ? (
        <DataTable
          headers={[
            strings.debts.description,
            strings.debts.counterparty,
            strings.debts.amount,
            strings.debts.direction,
            strings.debts.dueDate,
            strings.debts.status,
            strings.common.actions,
          ]}
        >
          {data.map((item) => (
            <tr key={item.id}>
              <td>{item.description}</td>
              <td>{item.counterparty ?? '—'}</td>
              <td className="mono">{formatMoney(item.amount)}</td>
              <td>{strings.debts.directions[item.direction]}</td>
              <td>{item.due_date ? formatDate(item.due_date) : '—'}</td>
              <td>{strings.debts.statuses[item.status]}</td>
              <td className="actions-cell">
                {item.status === 'pending' ? (
                  <>
                    <IconButton
                      label={strings.debts.settle}
                      icon={Check}
                      onClick={() => handleSettle(item.id)}
                      disabled={!contextId || settleMutation.isPending}
                    />
                    <IconButton
                      label={strings.common.edit}
                      icon={Pencil}
                      onClick={() => openEdit(item)}
                      disabled={!contextId}
                    />
                  </>
                ) : null}
                <IconButton
                  label={strings.common.delete}
                  icon={Trash2}
                  variant="danger"
                  onClick={() => handleDelete(item.id)}
                  disabled={deleteMutation.isPending || !contextId}
                />
              </td>
            </tr>
          ))}
        </DataTable>
      ) : null}

      {open && contextId ? (
        <Modal
          title={isEdit ? strings.debts.edit : strings.debts.create}
          onClose={closeModal}
        >
          <form
            className="form-grid"
            onSubmit={form.handleSubmit((values) =>
              mutation.mutateAsync(values),
            )}
          >
            <Field
              label={strings.debts.description}
              error={form.formState.errors.description?.message}
            >
              <TextInput {...form.register('description')} />
            </Field>
            <Field
              label={strings.debts.amount}
              error={form.formState.errors.amount?.message}
            >
              <TextInput
                type="number"
                step="0.01"
                {...form.register('amount')}
              />
            </Field>
            {!isEdit ? (
              <Field label={strings.debts.direction}>
                <TextSelect {...form.register('direction')}>
                  <option value="i_owe">
                    {strings.debts.directions.i_owe}
                  </option>
                  <option value="owed_to_me">
                    {strings.debts.directions.owed_to_me}
                  </option>
                </TextSelect>
              </Field>
            ) : (
              <p className="muted small">
                {strings.debts.directions[editing.direction]}
              </p>
            )}
            <Field label={strings.debts.counterparty}>
              <TextInput {...form.register('counterparty')} />
            </Field>
            <Field label={strings.debts.dueDate}>
              <TextInput type="date" {...form.register('due_date')} />
            </Field>
            <Field label={strings.debts.notes}>
              <TextInput {...form.register('notes')} />
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
    </div>
  )
}
