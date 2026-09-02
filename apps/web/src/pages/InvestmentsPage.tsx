import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2 } from 'lucide-react'
import { investmentsApi } from '@/api'
import { InvestmentForm } from '@/components/investments/InvestmentForm'
import {
  sumInvestments,
  type InvestmentFormValues,
} from '@/components/investments/investmentUtils'
import {
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
  useConfirm,
} from '@/components/ui'
import { useWritableContextId } from '@/hooks/useWritableContextId'
import { strings } from '@/i18n/pt-BR'
import { formatMoney } from '@/lib/format'
import { getErrorMessage } from '@/lib/errors'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'
import { toastError, toastSuccess } from '@/store/toastStore'
import type { Investment } from '@/types/models'

const t = strings.investments

export function InvestmentsPage() {
  const confirm = useConfirm()
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

  const totalPosition = useMemo(() => sumInvestments(data), [data])

  function openCreate() {
    setEditing(null)
    setOpen(true)
  }

  function openEdit(item: Investment) {
    setEditing(item)
    setOpen(true)
  }

  function closeModal() {
    setOpen(false)
    setEditing(null)
  }

  const mutation = useMutation({
    mutationFn: (values: InvestmentFormValues) => {
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
      toastSuccess(isEdit ? t.updated : t.created)
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (investmentId: string) =>
      investmentsApi.deleteInvestment(contextId!, investmentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['investments'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toastSuccess(t.deleted)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  async function handleDelete(investmentId: string) {
    if (
      !(await confirm({
        message: t.confirmDelete,
        tone: 'danger',
      }))
    ) {
      return
    }
    deleteMutation.mutate(investmentId)
  }

  return (
    <div className="space-y-6 bg-canvas text-fg">
      <PageHeader
        title={t.title}
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

      {listContextId && data.length > 0 ? (
        <Stat
          label={t.totalPosition}
          value={<Money amount={totalPosition} size="lg" />}
        />
      ) : null}

      {isLoading ? <LoadingBlock label={strings.common.loading} /> : null}
      {isError ? <ErrorBanner message={strings.common.error} /> : null}

      {!isLoading && listContextId && data.length === 0 ? (
        <EmptyState message={t.empty} />
      ) : null}

      {data.length > 0 ? (
        <DataTable
          headers={[
            t.name,
            t.type,
            t.institution,
            { label: t.investedAmount, right: true },
            { label: t.currentPosition, right: true },
            strings.common.actions,
          ]}
        >
          {data.map((item) => (
            <Tr key={item.id}>
              <Td>{item.name}</Td>
              <Td>{item.type}</Td>
              <Td>{item.institution ?? '—'}</Td>
              <Td right className="tabular-nums">
                {formatMoney(item.invested_amount)}
              </Td>
              <Td right className="tabular-nums">
                {formatMoney(item.current_position)}
              </Td>
              <Td>
                <div className="flex flex-wrap gap-1">
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
          <InvestmentForm
            editing={editing}
            isPending={mutation.isPending}
            error={
              mutation.isError ? getErrorMessage(mutation.error) : null
            }
            onCancel={closeModal}
            onSubmit={(values) => mutation.mutate(values)}
          />
        </Modal>
      ) : null}
    </div>
  )
}
