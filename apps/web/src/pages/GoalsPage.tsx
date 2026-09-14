import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { goalsApi, transactionsApi } from '@/api'
import { GoalCard } from '@/components/goals/GoalCard'
import { GoalContributeForm } from '@/components/goals/GoalContributeForm'
import { GoalForm } from '@/components/goals/GoalForm'
import type { GoalContributeValues, GoalFormValues } from '@/components/goals/schemas'
import {
  Button,
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  Modal,
  PageHeader,
  useConfirm,
} from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { getErrorMessage } from '@/lib/errors'
import { useWritableContextId } from '@/hooks/useWritableContextId'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'
import { toastError, toastSuccess } from '@/store/toastStore'
import type { Goal } from '@/types/models'

const t = strings.goals

export function GoalsPage() {
  const confirm = useConfirm()
  const queryClient = useQueryClient()
  const activeScope = useAuthStore((s) => s.activeScope)
  const contextId = useWritableContextId()
  const listContextId = activeScope === CONSOLIDATED ? null : activeScope
  const [editing, setEditing] = useState<Goal | null>(null)
  const [open, setOpen] = useState(false)
  const [contributeFor, setContributeFor] = useState<Goal | null>(null)
  const isEdit = editing !== null

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['goals', listContextId],
    queryFn: () => goalsApi.listGoals(listContextId!),
    enabled: Boolean(listContextId),
  })

  function openCreate() {
    setEditing(null)
    setOpen(true)
  }

  function openEdit(item: Goal) {
    setEditing(item)
    setOpen(true)
  }

  function closeModal() {
    setOpen(false)
    setEditing(null)
  }

  const mutation = useMutation({
    mutationFn: (values: GoalFormValues) => {
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
      toastSuccess(isEdit ? t.updated : t.created)
      closeModal()
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (goalId: string) => goalsApi.deleteGoal(contextId!, goalId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['goals'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toastSuccess(t.deleted)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  async function handleDelete(goalId: string) {
    if (
      !(await confirm({
        message: t.confirmDelete,
        tone: 'danger',
      }))
    ) {
      return
    }
    deleteMutation.mutate(goalId)
  }

  const contributeMutation = useMutation({
    mutationFn: (values: GoalContributeValues) =>
      transactionsApi.createTransaction(contextId!, {
        account_id: values.account_id,
        category_id: null,
        description: t.contributionDescription(contributeFor!.name),
        amount: values.amount,
        type: 'income',
        date: values.occurred_at,
        settled: true,
        goal_id: contributeFor!.id,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['goals'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      await queryClient.invalidateQueries({ queryKey: ['transactions'] })
      await queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toastSuccess(t.contributed)
      setContributeFor(null)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

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

      {!isLoading && listContextId && data.length === 0 ? (
        <EmptyState message={t.empty} />
      ) : null}

      <div className="grid gap-4">
        {data.map((item) => (
          <GoalCard
            key={item.id}
            goal={item}
            onEdit={() => openEdit(item)}
            onDelete={() => handleDelete(item.id)}
            onContribute={() => setContributeFor(item)}
            canMutate={Boolean(contextId)}
            deletePending={deleteMutation.isPending}
          />
        ))}
      </div>

      {open && contextId ? (
        <Modal
          title={isEdit ? t.edit : t.create}
          onClose={closeModal}
        >
          <GoalForm
            editing={editing}
            isPending={mutation.isPending}
            error={mutation.isError ? getErrorMessage(mutation.error) : null}
            onSubmit={(values) => mutation.mutate(values)}
            onCancel={closeModal}
          />
        </Modal>
      ) : null}

      {contributeFor && contextId ? (
        <Modal title={t.contributeTitle} onClose={() => setContributeFor(null)}>
          <GoalContributeForm
            goal={contributeFor}
            contextId={contextId}
            isPending={contributeMutation.isPending}
            error={contributeMutation.isError ? getErrorMessage(contributeMutation.error) : null}
            onSubmit={(values) => contributeMutation.mutate(values)}
            onCancel={() => setContributeFor(null)}
          />
        </Modal>
      ) : null}
    </div>
  )
}
