import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/api/http'
import { billCapturesApi } from '@/api'
import { BillCaptureList } from '@/components/billCaptures/BillCaptureList'
import {
  BillCaptureConfirmModal,
  BillCaptureSaveRuleModal,
  BillCaptureUnlockModal,
} from '@/components/billCaptures/BillCaptureModals'
import { senderDomain } from '@/components/billCaptures/captureDisplay'
import type { ConfirmCaptureValues } from '@/components/billCaptures/schemas'
import {
  Button,
  EmptyState,
  ErrorBanner,
  Field,
  LoadingBlock,
  PageHeader,
  TextSelect,
} from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { getErrorMessage } from '@/lib/errors'
import { useAuthStore, CONSOLIDATED } from '@/store/authStore'
import { toastError, toastSuccess } from '@/store/toastStore'
import type { BillCapture } from '@/types/models'
import type { BillCaptureListStatus } from '@/api/billCaptures'

const t = strings.billCaptures
const NOT_WAITING_PASSWORD = 'Esta pendência não está aguardando senha.'

export function BillCapturesPage() {
  const queryClient = useQueryClient()
  const contexts = useAuthStore((s) => s.contexts)
  const activeScope = useAuthStore((s) => s.activeScope)
  const [statusFilter, setStatusFilter] =
    useState<BillCaptureListStatus>('pending')
  const [confirming, setConfirming] = useState<BillCapture | null>(null)
  const [unlocking, setUnlocking] = useState<BillCapture | null>(null)
  const [saveRule, setSaveRule] = useState<{
    capture: BillCapture
    password: string
  } | null>(null)
  const [ruleLabel, setRuleLabel] = useState('')

  const orderedContexts = useMemo(
    () =>
      [...contexts].sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name, 'pt-BR')
        return a.type === 'pf' ? -1 : 1
      }),
    [contexts],
  )

  const defaultContextId =
    activeScope !== CONSOLIDATED &&
    contexts.some((c) => c.id === activeScope)
      ? activeScope
      : (orderedContexts[0]?.id ?? '')

  const listQuery = useQuery({
    queryKey: ['bill-captures', statusFilter],
    queryFn: () => billCapturesApi.listBillCaptures(statusFilter),
  })

  const confirmMutation = useMutation({
    mutationFn: (values: ConfirmCaptureValues) =>
      billCapturesApi.confirmBillCapture(confirming!.id, {
        context_id: values.context_id,
        description: values.description,
        amount: values.amount,
        due_date: values.due_date,
        direction: values.direction,
        category_id: values.category_id || null,
        beneficiary: values.beneficiary || null,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bill-captures'] })
      await queryClient.invalidateQueries({ queryKey: ['bills'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toastSuccess(t.confirmed)
      setConfirming(null)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (captureId: string) =>
      billCapturesApi.rejectBillCapture(captureId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bill-captures'] })
      toastSuccess(t.rejected)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  function handleReject(captureId: string) {
    if (!window.confirm(t.confirmReject)) return
    rejectMutation.mutate(captureId)
  }

  const unlockMutation = useMutation({
    mutationFn: (password: string) =>
      billCapturesApi.unlockBillCapture(unlocking!.id, password),
    onSuccess: async (_unlocked, password) => {
      await queryClient.invalidateQueries({ queryKey: ['bill-captures'] })
      toastSuccess(t.unlocked)
      const capture = unlocking
      setUnlocking(null)
      unlockMutation.reset()
      if (capture && senderDomain(capture.sender_email)) {
        setSaveRule({ capture, password })
        setRuleLabel('')
      }
    },
    onError: async (err) => {
      const message = getErrorMessage(err)
      const notWaiting =
        (err instanceof ApiError &&
          err.status === 422 &&
          message === NOT_WAITING_PASSWORD) ||
        message === NOT_WAITING_PASSWORD
      if (notWaiting) {
        await queryClient.invalidateQueries({ queryKey: ['bill-captures'] })
        setUnlocking(null)
        unlockMutation.reset()
      }
    },
  })

  const saveRuleMutation = useMutation({
    mutationFn: () => {
      const domain = senderDomain(saveRule!.capture.sender_email)
      if (!domain) {
        throw new Error(strings.common.error)
      }
      return billCapturesApi.saveBoletoPasswordRule({
        sender_domain: domain,
        rule_type: 'fixed',
        rule_params: { password: saveRule!.password },
        label: ruleLabel.trim() || undefined,
      })
    },
    onSuccess: () => {
      toastSuccess(t.ruleSaved)
      setSaveRule(null)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  const pollMutation = useMutation({
    mutationFn: () => billCapturesApi.pollBillCaptures(),
    onSuccess: async ({ processed, captured }) => {
      await queryClient.invalidateQueries({ queryKey: ['bill-captures'] })
      toastSuccess(t.pollSuccess(processed, captured))
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  const rows = listQuery.data ?? []

  return (
    <div className="space-y-6 bg-canvas text-fg">
      <PageHeader
        title={t.title}
        description={t.hint}
        actions={
          <Button
            variant="ghost"
            onClick={() => pollMutation.mutate()}
            disabled={pollMutation.isPending}
          >
            {pollMutation.isPending ? t.polling : t.poll}
          </Button>
        }
      />

      <Field label={t.statusFilter}>
        <TextSelect
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as BillCaptureListStatus)
          }
        >
          <option value="pending">{t.statuses.pending}</option>
          <option value="password_required">
            {t.statuses.password_required}
          </option>
          <option value="confirmed">{t.statuses.confirmed}</option>
          <option value="rejected">{t.statuses.rejected}</option>
          <option value="all">{t.statuses.all}</option>
        </TextSelect>
      </Field>

      {listQuery.isLoading ? (
        <LoadingBlock label={strings.common.loading} />
      ) : null}
      {listQuery.isError ? (
        <ErrorBanner message={getErrorMessage(listQuery.error)} />
      ) : null}

      {!listQuery.isLoading && rows.length === 0 ? (
        <EmptyState message={t.empty} />
      ) : null}

      {rows.length > 0 ? (
        <BillCaptureList
          rows={rows}
          onConfirm={setConfirming}
          onReject={handleReject}
          onUnlock={(capture) => {
            unlockMutation.reset()
            setUnlocking(capture)
          }}
          rejectPending={rejectMutation.isPending}
        />
      ) : null}

      {confirming ? (
        <BillCaptureConfirmModal
          capture={confirming}
          contexts={orderedContexts}
          defaultContextId={defaultContextId}
          isPending={confirmMutation.isPending}
          error={
            confirmMutation.isError
              ? getErrorMessage(confirmMutation.error)
              : null
          }
          onClose={() => setConfirming(null)}
          onSubmit={(values) => confirmMutation.mutate(values)}
        />
      ) : null}

      {unlocking ? (
        <BillCaptureUnlockModal
          capture={unlocking}
          isPending={unlockMutation.isPending}
          error={
            unlockMutation.isError
              ? getErrorMessage(unlockMutation.error)
              : null
          }
          onClose={() => {
            setUnlocking(null)
            unlockMutation.reset()
          }}
          onSubmit={(password) => unlockMutation.mutate(password)}
        />
      ) : null}

      {saveRule ? (
        <BillCaptureSaveRuleModal
          capture={saveRule.capture}
          label={ruleLabel}
          isPending={saveRuleMutation.isPending}
          error={
            saveRuleMutation.isError
              ? getErrorMessage(saveRuleMutation.error)
              : null
          }
          onLabelChange={setRuleLabel}
          onClose={() => setSaveRule(null)}
          onConfirm={() => saveRuleMutation.mutate()}
        />
      ) : null}
    </div>
  )
}
