import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Pencil, Trash2 } from 'lucide-react'
import { accountsApi, debtsApi } from '@/api'
import { DebtForm } from '@/components/debts/DebtForm'
import { SettleDebtForm } from '@/components/debts/SettleDebtForm'
import type { DebtFormValues } from '@/components/debts/schemas'
import {
  directionTone,
  summarizeDebts,
} from '@/components/debts/schemas'
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  ErrorBanner,
  IconButton,
  LoadingBlock,
  Modal,
  Money,
  PageHeader,
  Stat,
  Td,
  Tr,
} from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { formatDate, formatMoney } from '@/lib/format'
import { getErrorMessage } from '@/lib/errors'
import { useWritableContextId } from '@/hooks/useWritableContextId'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'
import { toastError, toastSuccess } from '@/store/toastStore'
import type { Debt } from '@/types/models'

const t = strings.debts

export function DebtsPage() {
  const queryClient = useQueryClient()
  const activeScope = useAuthStore((s) => s.activeScope)
  const contextId = useWritableContextId()
  const listContextId = activeScope === CONSOLIDATED ? null : activeScope
  const [editing, setEditing] = useState<Debt | null>(null)
  const [open, setOpen] = useState(false)
  const [settling, setSettling] = useState<Debt | null>(null)
  const isEdit = editing !== null

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['debts', listContextId],
    queryFn: () => debtsApi.listDebts(listContextId!),
    enabled: Boolean(listContextId),
  })

  const accountsQuery = useQuery({
    queryKey: ['accounts', listContextId],
    queryFn: () => accountsApi.listAccounts(listContextId!),
    enabled: Boolean(listContextId) && settling !== null,
  })

  const summary = useMemo(() => summarizeDebts(data), [data])

  function openCreate() {
    setEditing(null)
    setOpen(true)
  }

  function openEdit(item: Debt) {
    setEditing(item)
    setOpen(true)
  }

  function closeModal() {
    setOpen(false)
    setEditing(null)
  }

  const mutation = useMutation({
    mutationFn: (values: DebtFormValues) => {
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
      toastSuccess(isEdit ? t.updated : t.created)
      closeModal()
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  const settleMutation = useMutation({
    mutationFn: (values: { debtId: string; accountId: string | null }) =>
      debtsApi.settleDebt(contextId!, values.debtId, {
        account_id: values.accountId,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['debts'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toastSuccess(t.settled)
      setSettling(null)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (debtId: string) => debtsApi.deleteDebt(contextId!, debtId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['debts'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toastSuccess(t.deleted)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  function handleDelete(debtId: string) {
    if (!window.confirm(t.confirmDelete)) return
    deleteMutation.mutate(debtId)
  }

  return (
    <div className="space-y-6 bg-canvas text-fg">
      <PageHeader
        title={t.title}
        description={t.hint}
        actions={
          <Button
            onClick={openCreate}
            disabled={!contextId || activeScope === CONSOLIDATED}
          >
            {t.create}
          </Button>
        }
      />

      {activeScope === CONSOLIDATED ? (
        <ErrorBanner message={t.needContext} />
      ) : null}

      {isLoading ? <LoadingBlock label={strings.common.loading} /> : null}
      {isError ? <ErrorBanner message={strings.common.error} /> : null}

      {!isLoading && data.some((d) => d.status === 'pending') ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Stat
            label={t.totalOwe}
            value={<Money amount={summary.oweTotal} size="lg" />}
            tone="negative"
          />
          <Stat
            label={t.totalOwed}
            value={<Money amount={summary.owedTotal} size="lg" />}
            tone="positive"
          />
        </div>
      ) : null}

      {!isLoading && listContextId && data.length === 0 ? (
        <EmptyState message={t.empty} />
      ) : null}

      {data.length > 0 ? (
        <DataTable
          headers={[
            t.description,
            t.counterparty,
            { label: t.amount, right: true },
            t.direction,
            t.dueDate,
            t.status,
            strings.common.actions,
          ]}
        >
          {data.map((item) => (
            <Tr key={item.id}>
              <Td>{item.description}</Td>
              <Td>{item.counterparty ?? '—'}</Td>
              <Td right>{formatMoney(item.amount)}</Td>
              <Td>
                <Badge tone={directionTone(item.direction)} dot>
                  {t.directions[item.direction]}
                </Badge>
              </Td>
              <Td>{item.due_date ? formatDate(item.due_date) : '—'}</Td>
              <Td>
                <Badge
                  tone={item.status === 'pending' ? 'warning' : 'neutral'}
                  dot
                >
                  {t.statuses[item.status]}
                </Badge>
              </Td>
              <Td>
                <div className="flex justify-end gap-0.5">
                  {item.status === 'pending' ? (
                    <>
                      <IconButton
                        label={t.settle}
                        icon={Check}
                        variant="ghost"
                        size="sm"
                        onClick={() => setSettling(item)}
                        disabled={!contextId || settleMutation.isPending}
                      />
                      <IconButton
                        label={strings.common.edit}
                        icon={Pencil}
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(item)}
                        disabled={!contextId}
                      />
                    </>
                  ) : null}
                  <IconButton
                    label={strings.common.delete}
                    icon={Trash2}
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    disabled={deleteMutation.isPending || !contextId}
                  />
                </div>
              </Td>
            </Tr>
          ))}
        </DataTable>
      ) : null}

      {open && contextId ? (
        <Modal
          title={isEdit ? t.edit : t.create}
          onClose={closeModal}
        >
          <DebtForm
            editing={editing}
            isPending={mutation.isPending}
            error={mutation.isError ? getErrorMessage(mutation.error) : null}
            onSubmit={(values) => mutation.mutate(values)}
            onCancel={closeModal}
          />
        </Modal>
      ) : null}

      {settling && contextId ? (
        <Modal title={t.settle} onClose={() => setSettling(null)}>
          <SettleDebtForm
            accounts={accountsQuery.data ?? []}
            isPending={settleMutation.isPending}
            onSubmit={(accountId) =>
              settleMutation.mutate({
                debtId: settling.id,
                accountId,
              })
            }
            onCancel={() => setSettling(null)}
          />
        </Modal>
      ) : null}
    </div>
  )
}
