import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { authApi } from '@/api'
import { ApiError } from '@/api/http'
import {
  Alert,
  Button,
  ErrorBanner,
  Field,
  Modal,
  PageHeader,
  Panel,
  TextInput,
} from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { getErrorMessage } from '@/lib/errors'
import { useAuthStore } from '@/store/authStore'
import { toastSuccess } from '@/store/toastStore'
import type { MfaEnrollPayload } from '@/api/auth'

const s = strings.security

const confirmSchema = z.object({
  code: z.string().min(6, strings.common.required).max(8),
})

type ConfirmValues = z.infer<typeof confirmSchema>

const resetSchema = z.object({
  password: z.string().min(1, strings.common.required),
  confirmText: z.string(),
})

type ResetValues = z.infer<typeof resetSchema>

export function SecurityPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, setUser, clearSession } = useAuthStore()
  const [enroll, setEnroll] = useState<MfaEnrollPayload | null>(null)
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const confirmForm = useForm<ConfirmValues>({
    resolver: zodResolver(confirmSchema),
    defaultValues: { code: '' },
  })

  const resetForm = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmText: '' },
  })

  const resetPassword = resetForm.watch('password')
  const resetConfirmText = resetForm.watch('confirmText')
  const canReset =
    resetPassword.length > 0 && resetConfirmText === s.resetConfirmWord

  function openResetModal() {
    setError(null)
    resetForm.reset({ password: '', confirmText: '' })
    setResetModalOpen(true)
  }

  function closeResetModal() {
    setResetModalOpen(false)
    resetForm.reset({ password: '', confirmText: '' })
  }

  async function handleEnroll() {
    setError(null)
    setMessage(null)
    setBusy(true)
    try {
      const payload = await authApi.enrollMfa()
      setEnroll(payload)
      confirmForm.reset({ code: '' })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleConfirm(values: ConfirmValues) {
    setError(null)
    setMessage(null)
    setBusy(true)
    try {
      await authApi.confirmMfa(values.code)
      const me = await authApi.getMe()
      setUser(me)
      setEnroll(null)
      setMessage(s.enrollSuccess)
      toastSuccess(s.enrollSuccess)
    } catch (err) {
      setError(getErrorMessage(err, strings.auth.invalidMfa))
    } finally {
      setBusy(false)
    }
  }

  async function handleDisable() {
    setError(null)
    setMessage(null)
    setBusy(true)
    try {
      await authApi.disableMfa()
      const me = await authApi.getMe()
      setUser(me)
      setEnroll(null)
      setMessage(s.disableSuccess)
      toastSuccess(s.disableSuccess)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleReset(values: ResetValues) {
    if (values.confirmText !== s.resetConfirmWord) return

    setError(null)
    setBusy(true)
    try {
      await authApi.resetAccountData(values.password)
      closeResetModal()
      toastSuccess(s.resetSuccess)
      queryClient.clear()
      clearSession()
      void navigate('/login', { replace: true })
    } catch (err) {
      const fallback =
        err instanceof ApiError && err.status === 422 ? s.wrongPassword : undefined
      setError(getErrorMessage(err, fallback ?? strings.common.error))
    } finally {
      setBusy(false)
    }
  }

  const mfaEnabled = user?.mfa_enabled === true

  return (
    <div className="space-y-6 bg-canvas text-fg">
      <PageHeader title={s.title} />

      <Panel title={s.mfaStatus}>
        <p className="text-sm text-fg-muted">
          {s.statusLabel}:{' '}
          <strong className="text-fg">
            {mfaEnabled ? s.mfaEnabled : s.mfaDisabled}
          </strong>
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {!mfaEnabled ? (
            <Button onClick={() => void handleEnroll()} disabled={busy}>
              {s.enroll}
            </Button>
          ) : (
            <Button
              variant="danger"
              onClick={() => void handleDisable()}
              disabled={busy}
            >
              {s.disable}
            </Button>
          )}
        </div>
      </Panel>

      {enroll ? (
        <Panel title={s.enroll}>
          <p className="text-sm text-fg-muted">{s.qrHint}</p>
          <div
            className="my-4 inline-flex rounded-xl border border-line bg-white p-3"
            role="img"
            aria-label={s.qrAlt}
          >
            <QRCodeSVG value={enroll.otpauth_uri} size={192} />
          </div>
          <Field label={s.secretLabel}>
            <code className="block rounded-xl bg-surface-2 px-3 py-2 font-mono text-sm break-all">
              {enroll.secret}
            </code>
          </Field>
          <p className="mt-2 text-sm text-fg-muted">{s.codeHint}</p>
          <form
            className="mt-4 grid gap-4"
            onSubmit={confirmForm.handleSubmit((values) =>
              void handleConfirm(values),
            )}
          >
            <Field
              label={strings.auth.mfaCode}
              error={confirmForm.formState.errors.code?.message}
            >
              <TextInput
                inputMode="numeric"
                autoComplete="one-time-code"
                {...confirmForm.register('code')}
              />
            </Field>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEnroll(null)}
              >
                {strings.common.cancel}
              </Button>
              <Button type="submit" disabled={busy}>
                {s.confirm}
              </Button>
            </div>
          </form>
        </Panel>
      ) : null}

      <Panel
        title={s.dangerZone}
        className="border border-negative/40 bg-negative/5"
      >
        <p className="text-sm text-fg-muted">{s.resetDescription}</p>
        <div className="mt-4">
          <Button variant="danger" onClick={openResetModal} disabled={busy}>
            {s.resetButton}
          </Button>
        </div>
      </Panel>

      {resetModalOpen ? (
        <Modal title={s.resetTitle} onClose={closeResetModal}>
          <form
            className="grid gap-4"
            onSubmit={resetForm.handleSubmit((values) => void handleReset(values))}
          >
            <p className="text-sm text-fg-muted">{s.resetDescription}</p>
            <Field
              label={s.currentPassword}
              error={resetForm.formState.errors.password?.message}
            >
              <TextInput
                type="password"
                autoComplete="current-password"
                {...resetForm.register('password')}
              />
            </Field>
            <Field label={s.resetConfirmHint(s.resetConfirmWord)}>
              <TextInput
                autoComplete="off"
                {...resetForm.register('confirmText')}
              />
            </Field>
            {error ? <ErrorBanner message={error} /> : null}
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="ghost" onClick={closeResetModal}>
                {strings.common.cancel}
              </Button>
              <Button
                type="submit"
                variant="danger"
                disabled={busy || !canReset}
              >
                {s.resetConfirm}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {error && !resetModalOpen ? <ErrorBanner message={error} /> : null}
      {message ? <Alert tone="success">{message}</Alert> : null}
    </div>
  )
}
