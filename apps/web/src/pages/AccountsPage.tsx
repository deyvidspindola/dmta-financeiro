import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { accountsApi, consolidatedApi, transactionsApi } from '@/api'
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
  MoneyInput,
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
const ta = strings.accountDetail

export function AccountsPage() {
  const confirm = useConfirm()
  const queryClient = useQueryClient()
  const activeScope = useAuthStore((s) => s.activeScope)
  const contextId = useWritableContextId()
  const [editing, setEditing] = useState<Account | null>(null)
  const [open, setOpen] = useState(false)
  const [adjusting, setAdjusting] = useState<Account | null>(null)
  const [adjustBalance, setAdjustBalance] = useState(0)
  const [adjustError, setAdjustError] = useState<string | null>(null)
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

  function openAdjust(account: Account) {
    setAdjusting(account)
    setAdjustBalance(account.balance)
    setAdjustError(null)
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

  const adjustMutation = useMutation({
    mutationFn: async (target: number) => {
      if (!adjusting || !contextId) return
      const diff = Math.round((target - adjusting.balance) * 100) / 100
      if (diff === 0) throw new Error(ta.adjustBalanceSame)
      
      const today = new Date()
      const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      
      return transactionsApi.createTransaction(contextId, {
        account_id: adjusting.id,
        category_id: null,
        description: ta.adjustBalanceDescription,
        amount: Math.abs(diff),
        type: diff > 0 ? 'income' : 'expense',
        date: localDate,
        settled: true,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['accounts'] })
      await queryClient.invalidateQueries({ queryKey: ['transactions'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setAdjusting(null)
      setAdjustError(null)
      toastSuccess(ta.adjustBalanceSuccess)
    },
    onError: (err) => {
      setAdjustError(getErrorMessage(err))
    },
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
            onAdjust={openAdjust}
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

      {adjusting && contextId ? (
        <Modal
          title={ta.adjustBalance}
          onClose={() => setAdjusting(null)}
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => setAdjusting(null)}
                disabled={adjustMutation.isPending}
              >
                {strings.common.cancel}
              </Button>
              <Button
                onClick={() => {
                  setAdjustError(null)
                  adjustMutation.mutate(adjustBalance)
                }}
                disabled={adjustMutation.isPending}
              >
                {adjustMutation.isPending ? strings.common.loading : ta.adjustBalanceSubmit}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-fg-muted">{ta.adjustBalanceHint}</p>
            <div className="space-y-1.5">
              <label htmlFor="adjust-balance-input" className="block text-sm font-medium text-fg">
                {ta.adjustBalanceNewBalance}
              </label>
              <MoneyInput
                id="adjust-balance-input"
                value={adjustBalance}
                onChange={setAdjustBalance}
                disabled={adjustMutation.isPending}
              />
            </div>
            {adjustError ? (
              <p className="text-sm text-negative">{adjustError}</p>
            ) : null}
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
