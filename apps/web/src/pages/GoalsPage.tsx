import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2 } from 'lucide-react'
import { z } from 'zod'
import { goalsApi } from '@/api'
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
} from '@/components/ui'
import type { Goal } from '@/types/models'

const schema = z.object({
  name: z.string().min(1, strings.common.required),
  target_amount: z.coerce.number().positive(),
  target_date: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const emptyValues: FormValues = {
  name: '',
  target_amount: 0,
  target_date: '',
  notes: '',
}

export function GoalsPage() {
  const queryClient = useQueryClient()
  const activeScope = useAuthStore((s) => s.activeScope)
  const contextId = useWritableContextId()
  const listContextId = activeScope === CONSOLIDATED ? null : activeScope
  const [editing, setEditing] = useState<Goal | null>(null)
  const [open, setOpen] = useState(false)
  const isEdit = editing !== null

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['goals', listContextId],
    queryFn: () => goalsApi.listGoals(listContextId!),
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

  function openEdit(item: Goal) {
    setEditing(item)
    form.reset({
      name: item.name,
      target_amount: item.target_amount,
      target_date: item.target_date ?? '',
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
      const payload = {
        name: values.name,
        target_amount: values.target_amount,
        target_date: values.target_date || null,
        notes: values.notes || null,
      }
      if (isEdit && editing) {
        return goalsApi.updateGoal(contextId!, editing.id, payload)
      }
      return goalsApi.createGoal(contextId!, payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['goals'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toastSuccess(isEdit ? strings.goals.updated : strings.goals.created)
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (goalId: string) => goalsApi.deleteGoal(contextId!, goalId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['goals'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toastSuccess(strings.goals.deleted)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  function handleDelete(goalId: string) {
    if (!window.confirm(strings.goals.confirmDelete)) return
    deleteMutation.mutate(goalId)
  }

  return (
    <div className="stack">
      <PageHeader
        title={strings.goals.title}
        description={strings.goals.hint}
        actions={
          <Button
            onClick={openCreate}
            disabled={!contextId || activeScope === CONSOLIDATED}
          >
            {strings.goals.create}
          </Button>
        }
      />

      {activeScope === CONSOLIDATED ? (
        <ErrorBanner message={strings.goals.needContext} />
      ) : null}

      {isLoading ? <LoadingBlock label={strings.common.loading} /> : null}
      {isError ? <ErrorBanner message={strings.common.error} /> : null}

      {!isLoading && listContextId && data.length === 0 ? (
        <EmptyState message={strings.goals.empty} />
      ) : null}

      {data.length > 0 ? (
        <DataTable
          headers={[
            strings.goals.name,
            strings.goals.targetAmount,
            strings.goals.currentAmount,
            strings.goals.percent,
            strings.goals.targetDate,
            strings.goals.status,
            strings.common.actions,
          ]}
        >
          {data.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td className="mono">{formatMoney(item.target_amount)}</td>
              <td className="mono">{formatMoney(item.current_amount)}</td>
              <td>
                <div className="progress">
                  <div
                    className="progress__bar"
                    style={{
                      width: `${Math.min(100, Math.max(0, item.percent_complete))}%`,
                    }}
                  />
                </div>
                <span className="muted small">{item.percent_complete}%</span>
              </td>
              <td>
                {item.target_date ? formatDate(item.target_date) : '—'}
              </td>
              <td>
                <span className={`status-badge status-badge--${item.status}`}>
                  {strings.goals.statuses[item.status]}
                </span>
              </td>
              <td className="actions-cell">
                <IconButton
                  label={strings.common.edit}
                  icon={Pencil}
                  onClick={() => openEdit(item)}
                  disabled={!contextId}
                />
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
          title={isEdit ? strings.goals.edit : strings.goals.create}
          onClose={closeModal}
        >
          <form
            className="form-grid"
            onSubmit={form.handleSubmit((values) =>
              mutation.mutateAsync(values),
            )}
          >
            <Field
              label={strings.goals.name}
              error={form.formState.errors.name?.message}
            >
              <TextInput {...form.register('name')} />
            </Field>
            <Field
              label={strings.goals.targetAmount}
              error={form.formState.errors.target_amount?.message}
            >
              <TextInput
                type="number"
                step="0.01"
                {...form.register('target_amount')}
              />
            </Field>
            {isEdit && editing ? (
              <>
                <p className="muted small">
                  {strings.goals.currentAmount}:{' '}
                  {formatMoney(editing.current_amount)} ·{' '}
                  {editing.percent_complete}% ·{' '}
                  {strings.goals.statuses[editing.status]}
                </p>
              </>
            ) : null}
            <Field label={strings.goals.targetDate}>
              <TextInput type="date" {...form.register('target_date')} />
            </Field>
            <Field label={strings.goals.notes}>
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
