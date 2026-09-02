import { useMemo, useState, type ReactNode } from 'react'
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
  EmptyState,
  ErrorBanner,
  IconButton,
  LoadingBlock,
  Modal,
  Money,
  MoneyValue,
  PageHeader,
  StatementGroup,
  StatementList,
  StatementRow,
  Stat,
  useConfirm,
} from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { formatDate } from '@/lib/format'
import { getErrorMessage } from '@/lib/errors'
import { useWritableContextId } from '@/hooks/useWritableContextId'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'
import { toastError, toastSuccess } from '@/store/toastStore'
import type { Debt } from '@/types/models'

const t = strings.debts

function groupDebts(rows: Debt[]): [string, Debt[]][] {
  const map = new Map<string, Debt[]>()
  for (const item of rows) {
    const day = item.due_date ?? ''
    const list = map.get(day) ?? []
    list.push(item)
    map.set(day, list)
  }
  return [...map.entries()].sort(([a], [b]) => {
    if (a === '') return 1
    if (b === '') return -1
    return b.localeCompare(a)
  })
}

function debtDirectionMoney(direction: Debt['direction']): 'credit' | 'debit' {
  return direction === 'owed_to_me' ? 'credit' : 'debit'
}

export function DebtsPage() {
  const confirm = useConfirm()
  const queryClient = useQueryClient()
  const activeScope = useAuthStore((s) => s.activeScope)
  const contextId = useWritableContextId()
  const listContextId = activeScope === CONSOLIDATED ? null : activeScope
  const [editing, setEditing] = useState<Debt | null>(null)
  const [open, setOpen] = useState(false)
  const [settling, setSettling] = useState<Debt | null>(null)
  const [detail, setDetail] = useState<Debt | null>(null)
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
  const grouped = useMemo(() => groupDebts(data), [data])

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

  async function handleDelete(debtId: string) {
    if (
      !(await confirm({
        message: t.confirmDelete,
        tone: 'danger',
      }))
    ) {
      return
    }
    deleteMutation.mutate(debtId)
    setDetail(null)
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
        <StatementList>
          {grouped.map(([day, dayRows]) => (
            <StatementGroup
              key={day || 'none'}
              label={day ? formatDate(day) : t.noDueDate}
            >
              {dayRows.map((item) => (
                <StatementRow
                  key={item.id}
                  title={item.description}
                  ariaLabel={item.description}
                  onClick={() => setDetail(item)}
                  meta={
                    <>
                      <Badge tone={directionTone(item.direction)} dot>
                        {t.directions[item.direction]}
                      </Badge>
                      <Badge
                        tone={item.status === 'pending' ? 'warning' : 'neutral'}
                        dot
                      >
                        {t.statuses[item.status]}
                      </Badge>
                      {item.counterparty ? (
                        <span>{item.counterparty}</span>
                      ) : null}
                    </>
                  }
                  amount={
                    <MoneyValue
                      amount={item.amount}
                      direction={debtDirectionMoney(item.direction)}
                      size="sm"
                    />
                  }
                />
              ))}
            </StatementGroup>
          ))}
        </StatementList>
      ) : null}

      {detail ? (
        <Modal
          title={detail.description}
          size="lg"
          onClose={() => setDetail(null)}
          footer={
            contextId ? (
              <div className="flex w-full flex-wrap items-center justify-end gap-1">
                {detail.status === 'pending' ? (
                  <>
                    <IconButton
                      label={t.settle}
                      icon={Check}
                      onClick={() => {
                        setSettling(detail)
                        setDetail(null)
                      }}
                    />
                    <IconButton
                      label={strings.common.edit}
                      icon={Pencil}
                      onClick={() => {
                        openEdit(detail)
                        setDetail(null)
                      }}
                    />
                  </>
                ) : null}
                <IconButton
                  label={strings.common.delete}
                  icon={Trash2}
                  variant="danger"
                  onClick={() => handleDelete(detail.id)}
                  disabled={deleteMutation.isPending}
                />
              </div>
            ) : undefined
          }
        >
          <DebtDetailBody debt={detail} />
        </Modal>
      ) : null}

      {open && contextId ? (
        <Modal title={isEdit ? t.edit : t.create} onClose={closeModal}>
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

function DebtDetailBody({ debt }: { debt: Debt }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <MoneyValue
          amount={debt.amount}
          direction={debtDirectionMoney(debt.direction)}
          size="lg"
        />
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <Badge tone={directionTone(debt.direction)} dot>
            {t.directions[debt.direction]}
          </Badge>
          <Badge
            tone={debt.status === 'pending' ? 'warning' : 'neutral'}
            dot
          >
            {t.statuses[debt.status]}
          </Badge>
        </div>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <DetailItem label={t.counterparty}>
          {debt.counterparty ?? '—'}
        </DetailItem>
        <DetailItem label={t.dueDate}>
          {debt.due_date ? formatDate(debt.due_date) : '—'}
        </DetailItem>
        {debt.notes ? (
          <DetailItem label={t.notes}>{debt.notes}</DetailItem>
        ) : null}
      </dl>
    </div>
  )
}

function DetailItem({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-fg">{children}</dd>
    </div>
  )
}
