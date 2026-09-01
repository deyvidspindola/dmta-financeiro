import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { Pencil, Trash2 } from 'lucide-react'
import { accountsApi, consolidatedApi } from '@/api'
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
  TextSelect,
} from '@/components/ui-legacy'
import type { Account } from '@/types/models'

const schema = z.object({
  name: z.string().min(1, strings.common.required),
  bank_name: z.string().optional(),
  type: z.enum(['checking', 'savings', 'wallet', 'other']),
  balance: z.coerce.number(),
})

type FormValues = z.infer<typeof schema>

const emptyValues: FormValues = {
  name: '',
  bank_name: '',
  type: 'checking',
  balance: 0,
}

export function AccountsPage() {
  const queryClient = useQueryClient()
  const activeScope = useAuthStore((s) => s.activeScope)
  const contextId = useWritableContextId()
  const [editing, setEditing] = useState<Account | null>(null)
  const [open, setOpen] = useState(false)
  const isEdit = editing !== null

  const isConsolidated = activeScope === CONSOLIDATED

  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ['accounts', activeScope],
    queryFn: () =>
      isConsolidated
        ? consolidatedApi.listConsolidatedAccounts()
        : accountsApi.listAccounts(activeScope),
    enabled: isConsolidated || Boolean(activeScope),
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

  function openEdit(account: Account) {
    setEditing(account)
    form.reset({
      name: account.name,
      bank_name: account.bank_name ?? '',
      type: account.type,
      balance: account.balance,
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
        return accountsApi.updateAccount(contextId!, editing.id, {
          name: values.name,
          bank_name: values.bank_name || null,
          type: values.type,
        })
      }
      return accountsApi.createAccount(contextId!, {
        name: values.name,
        bank_name: values.bank_name || null,
        type: values.type,
        balance: values.balance,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['accounts'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toastSuccess(isEdit ? strings.accounts.updated : strings.accounts.created)
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (accountId: string) =>
      accountsApi.deleteAccount(contextId!, accountId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['accounts'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toastSuccess(strings.accounts.deleted)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  function handleDelete(accountId: string) {
    if (!window.confirm(strings.accounts.confirmDelete)) return
    deleteMutation.mutate(accountId)
  }

  return (
    <div className="stack">
      <PageHeader
        title={strings.accounts.title}
        actions={
          <Button
            onClick={openCreate}
            disabled={!contextId || activeScope === CONSOLIDATED}
          >
            {strings.accounts.create}
          </Button>
        }
      />

      {isConsolidated ? (
        <p className="muted small">{strings.common.consolidatedHint}</p>
      ) : null}

      {isLoading ? <LoadingBlock label={strings.common.loading} /> : null}
      {isError ? (
        <ErrorBanner message={getErrorMessage(error)} />
      ) : null}

      {!isLoading && data.length === 0 ? (
        <EmptyState message={strings.accounts.empty} />
      ) : null}

      {data.length > 0 ? (
        <DataTable
          headers={[
            ...(isConsolidated ? [strings.common.context] : []),
            strings.accounts.name,
            strings.accounts.bankName,
            strings.accounts.type,
            strings.accounts.balance,
            ...(isConsolidated ? [] : [strings.common.actions]),
          ]}
        >
          {data.map((account) => (
            <tr key={`${account.context_id}-${account.id}`}>
              {isConsolidated ? (
                <td>{account.context?.name ?? '—'}</td>
              ) : null}
              <td>
                <Link
                  to={`/accounts/${account.id}?context=${account.context_id}`}
                  className="row-link"
                >
                  {account.name}
                </Link>
              </td>
              <td>{account.bank_name ?? '—'}</td>
              <td>{strings.accounts.types[account.type]}</td>
              <td className="mono">{formatMoney(account.balance)}</td>
              {!isConsolidated ? (
                <td className="actions-cell">
                  <IconButton
                    label={strings.common.edit}
                    icon={Pencil}
                    onClick={() => openEdit(account)}
                    disabled={!contextId}
                  />
                  <IconButton
                    label={strings.common.delete}
                    icon={Trash2}
                    variant="danger"
                    onClick={() => handleDelete(account.id)}
                    disabled={deleteMutation.isPending || !contextId}
                  />
                </td>
              ) : null}
            </tr>
          ))}
        </DataTable>
      ) : null}

      {open && contextId ? (
        <Modal
          title={isEdit ? strings.accounts.edit : strings.accounts.create}
          onClose={closeModal}
        >
          <form
            className="form-grid"
            onSubmit={form.handleSubmit((values) =>
              mutation.mutateAsync(values),
            )}
          >
            <Field
              label={strings.accounts.name}
              error={form.formState.errors.name?.message}
            >
              <TextInput {...form.register('name')} />
            </Field>
            <Field label={strings.accounts.bankName}>
              <TextInput {...form.register('bank_name')} />
            </Field>
            <Field label={strings.accounts.type}>
              <TextSelect {...form.register('type')}>
                {(
                  Object.keys(strings.accounts.types) as Array<
                    keyof typeof strings.accounts.types
                  >
                ).map((key) => (
                  <option key={key} value={key}>
                    {strings.accounts.types[key]}
                  </option>
                ))}
              </TextSelect>
            </Field>
            {!isEdit ? (
              <Field
                label={strings.accounts.balance}
                error={form.formState.errors.balance?.message}
              >
                <TextInput
                  type="number"
                  step="0.01"
                  {...form.register('balance')}
                />
              </Field>
            ) : null}
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
