import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { QRCodeSVG } from 'qrcode.react'
import { z } from 'zod'
import { authApi } from '@/api'
import {
  Alert,
  Button,
  ErrorBanner,
  Field,
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

export function SecurityPage() {
  const { user, setUser } = useAuthStore()
  const [enroll, setEnroll] = useState<MfaEnrollPayload | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const confirmForm = useForm<ConfirmValues>({
    resolver: zodResolver(confirmSchema),
    defaultValues: { code: '' },
  })

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

      {error ? <ErrorBanner message={error} /> : null}
      {message ? <Alert tone="success">{message}</Alert> : null}
    </div>
  )
}
