import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { accountsApi, consolidatedApi } from '@/api'
import { AccountCard } from '@/components/accounts/AccountCard'
import { AccountForm } from '@/components/accounts/AccountForm'
import type { AccountFormValues } from '@/components/accounts/schemas'
import {
  Button,
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  Modal,
  Money,
  PageHeader,
  Stat,
  useConfirm,
} from '@/components/ui'
import { useWritableContextId } from '@/hooks/useWritableContextId'
import { strings } from '@/i18n/pt-BR'
import { getErrorMessage } from '@/lib/errors'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'
import { toastError, toastSuccess } from '@/store/toastStore'
import type { Account } from '@/types/models'

const t = strings.accounts

export function AccountsPage() {
  const confirm = useConfirm()
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

  const totalBalance = useMemo(
    () => data.reduce((sum, account) => sum + account.balance, 0),
    [data],
  )

  function openCreate() {
    setEditing(null)
    setOpen(true)
  }

  function openEdit(account: Account) {
    setEditing(account)
    setOpen(true)
  }

  function closeModal() {
    setOpen(false)
    setEditing(null)
  }

  const mutation = useMutation({
    mutationFn: (values: AccountFormValues) => {
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
      toastSuccess(isEdit ? t.updated : t.created)
      closeModal()
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (accountId: string) =>
      accountsApi.deleteAccount(contextId!, accountId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['accounts'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toastSuccess(t.deleted)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  async function handleDelete(accountId: string) {
    if (
      !(await confirm({
        message: t.confirmDelete,
        tone: 'danger',
      }))
    ) {
      return
    }
    deleteMutation.mutate(accountId)
  }

  return (
    <div className="space-y-6 bg-canvas text-fg">
      <PageHeader
        title={t.title}
        actions={
          !isConsolidated ? (
            <Button
              onClick={openCreate}
              disabled={!contextId}
            >
              <Plus size={16} /> {t.create}
            </Button>
          ) : undefined
        }
      />

      {isConsolidated ? (
        <p className="text-sm text-fg-muted">{strings.common.consolidatedHint}</p>
      ) : null}

      {isLoading ? <LoadingBlock label={strings.common.loading} /> : null}
      {isError ? <ErrorBanner message={getErrorMessage(error)} /> : null}

      {!isLoading && data.length > 0 ? (
        <Stat
          label={t.totalBalance}
          value={<Money amount={totalBalance} size="lg" />}
          tone="brand"
        />
      ) : null}

      {!isLoading && data.length === 0 ? (
        <EmptyState message={t.empty} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.map((account) => (
          <AccountCard
            key={`${account.context_id}-${account.id}`}
            account={account}
            isConsolidated={isConsolidated}
            onEdit={openEdit}
            onDelete={handleDelete}
            deletePending={deleteMutation.isPending}
            canMutate={Boolean(contextId)}
          />
        ))}
      </div>

      {open && contextId ? (
        <Modal
          title={isEdit ? t.edit : t.create}
          onClose={closeModal}
        >
          <AccountForm
            isEdit={isEdit}
            initialValues={
              editing
                ? {
                    name: editing.name,
                    bank_name: editing.bank_name ?? '',
                    type: editing.type,
                    balance: editing.balance,
                  }
                : undefined
            }
            isPending={mutation.isPending}
            error={mutation.isError ? getErrorMessage(mutation.error) : null}
            onSubmit={(values) => mutation.mutate(values)}
            onCancel={closeModal}
          />
        </Modal>
      ) : null}
    </div>
  )
}
