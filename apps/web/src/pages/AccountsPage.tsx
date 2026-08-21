import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { accountsApi } from '@/api'
import { strings } from '@/i18n/pt-BR'
import { formatMoney } from '@/lib/format'
import { getErrorMessage } from '@/lib/errors'
import { useWritableContextId } from '@/hooks/useWritableContextId'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'
import { toastSuccess } from '@/store/toastStore'
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

const schema = z.object({
  name: z.string().min(1, strings.common.required),
  bank_name: z.string().optional(),
  type: z.enum(['checking', 'savings', 'cash', 'other']),
  balance: z.coerce.number(),
})

type FormValues = z.infer<typeof schema>

export function AccountsPage() {
  const queryClient = useQueryClient()
  const activeScope = useAuthStore((s) => s.activeScope)
  const contextId = useWritableContextId()
  const [open, setOpen] = useState(false)

  const listContextId =
    activeScope === CONSOLIDATED ? null : activeScope

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['accounts', listContextId],
    queryFn: () => accountsApi.listAccounts(listContextId!),
    enabled: Boolean(listContextId),
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      bank_name: '',
      type: 'checking',
      balance: 0,
    },
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      accountsApi.createAccount(contextId!, {
        name: values.name,
        bank_name: values.bank_name || null,
        type: values.type,
        balance: values.balance,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['accounts'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toastSuccess(strings.accounts.created)
      setOpen(false)
      form.reset()
    },
  })

  return (
    <div className="stack">
      <PageHeader
        title={strings.accounts.title}
        actions={
          <Button
            onClick={() => setOpen(true)}
            disabled={!contextId || activeScope === CONSOLIDATED}
          >
            {strings.accounts.create}
          </Button>
        }
      />

      {activeScope === CONSOLIDATED ? (
        <ErrorBanner message="Selecione um contexto (PF ou empresa) para cadastrar e listar contas." />
      ) : null}

      {isLoading ? <LoadingBlock label={strings.common.loading} /> : null}
      {isError ? <ErrorBanner message={strings.common.error} /> : null}

      {!isLoading && listContextId && data.length === 0 ? (
        <EmptyState message={strings.accounts.empty} />
      ) : null}

      {data.length > 0 ? (
        <DataTable
          headers={[
            strings.accounts.name,
            strings.accounts.bankName,
            strings.accounts.type,
            strings.accounts.balance,
          ]}
        >
          {data.map((account) => (
            <tr key={account.id}>
              <td>{account.name}</td>
              <td>{account.bank_name ?? '—'}</td>
              <td>{strings.accounts.types[account.type]}</td>
              <td className="mono">{formatMoney(account.balance)}</td>
            </tr>
          ))}
        </DataTable>
      ) : null}

      {open && contextId ? (
        <Modal title={strings.accounts.create} onClose={() => setOpen(false)}>
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
            <Field
              label={strings.accounts.balance}
              error={form.formState.errors.balance?.message}
            >
              <TextInput type="number" step="0.01" {...form.register('balance')} />
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
    </div>
  )
}
