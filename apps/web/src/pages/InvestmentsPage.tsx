import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2 } from 'lucide-react'
import { z } from 'zod'
import { investmentsApi } from '@/api'
import { strings } from '@/i18n/pt-BR'
import { formatMoney } from '@/lib/format'
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
} from '@/components/ui-legacy'
import type { Investment } from '@/types/models'

const schema = z.object({
  name: z.string().min(1, strings.common.required),
  type: z.string().min(1, strings.common.required),
  institution: z.string().optional(),
  invested_amount: z.coerce.number().nonnegative(),
  current_position: z.coerce.number().nonnegative(),
})

type FormValues = z.infer<typeof schema>

const emptyValues: FormValues = {
  name: '',
  type: '',
  institution: '',
  invested_amount: 0,
  current_position: 0,
}

export function InvestmentsPage() {
  const queryClient = useQueryClient()
  const activeScope = useAuthStore((s) => s.activeScope)
  const contextId = useWritableContextId()
  const [editing, setEditing] = useState<Investment | null>(null)
  const [open, setOpen] = useState(false)
  const listContextId = activeScope === CONSOLIDATED ? null : activeScope
  const isEdit = editing !== null

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['investments', listContextId],
    queryFn: () => investmentsApi.listInvestments(listContextId!),
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

  function openEdit(item: Investment) {
    setEditing(item)
    form.reset({
      name: item.name,
      type: item.type,
      institution: item.institution ?? '',
      invested_amount: item.invested_amount,
      current_position: item.current_position,
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
        return investmentsApi.updateInvestment(contextId!, editing.id, {
          name: values.name,
          type: values.type,
          institution: values.institution || null,
          current_position: values.current_position,
        })
      }
      return investmentsApi.createInvestment(contextId!, {
        name: values.name,
        type: values.type,
        institution: values.institution || null,
        invested_amount: values.invested_amount,
        current_position: values.current_position,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['investments'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toastSuccess(
        isEdit ? strings.investments.updated : strings.investments.created,
      )
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (investmentId: string) =>
      investmentsApi.deleteInvestment(contextId!, investmentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['investments'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toastSuccess(strings.investments.deleted)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  function handleDelete(investmentId: string) {
    if (!window.confirm(strings.investments.confirmDelete)) return
    deleteMutation.mutate(investmentId)
  }

  return (
    <div className="stack">
      <PageHeader
        title={strings.investments.title}
        actions={
          <Button
            onClick={openCreate}
            disabled={!contextId || activeScope === CONSOLIDATED}
          >
            {strings.investments.create}
          </Button>
        }
      />

      {activeScope === CONSOLIDATED ? (
        <ErrorBanner message="Selecione um contexto para cadastrar e listar investimentos." />
      ) : null}

      {isLoading ? <LoadingBlock label={strings.common.loading} /> : null}
      {isError ? <ErrorBanner message={strings.common.error} /> : null}

      {!isLoading && listContextId && data.length === 0 ? (
        <EmptyState message={strings.investments.empty} />
      ) : null}

      {data.length > 0 ? (
        <DataTable
          headers={[
            strings.investments.name,
            strings.investments.type,
            strings.investments.institution,
            strings.investments.investedAmount,
            strings.investments.currentPosition,
            strings.common.actions,
          ]}
        >
          {data.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.type}</td>
              <td>{item.institution ?? '—'}</td>
              <td className="mono">{formatMoney(item.invested_amount)}</td>
              <td className="mono">{formatMoney(item.current_position)}</td>
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
          title={
            isEdit ? strings.investments.edit : strings.investments.create
          }
          onClose={closeModal}
        >
          <form
            className="form-grid"
            onSubmit={form.handleSubmit((values) =>
              mutation.mutateAsync(values),
            )}
          >
            <Field
              label={strings.investments.name}
              error={form.formState.errors.name?.message}
            >
              <TextInput {...form.register('name')} />
            </Field>
            <Field
              label={strings.investments.type}
              error={form.formState.errors.type?.message}
            >
              <TextInput {...form.register('type')} />
            </Field>
            <Field label={strings.investments.institution}>
              <TextInput {...form.register('institution')} />
            </Field>
            {!isEdit ? (
              <Field
                label={strings.investments.investedAmount}
                error={form.formState.errors.invested_amount?.message}
              >
                <TextInput
                  type="number"
                  step="0.01"
                  {...form.register('invested_amount')}
                />
              </Field>
            ) : null}
            <Field
              label={strings.investments.currentPosition}
              error={form.formState.errors.current_position?.message}
            >
              <TextInput
                type="number"
                step="0.01"
                {...form.register('current_position')}
              />
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
