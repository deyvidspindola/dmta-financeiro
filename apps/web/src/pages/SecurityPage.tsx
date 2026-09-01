import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { QRCodeSVG } from 'qrcode.react'
import { z } from 'zod'
import { authApi } from '@/api'
import { strings } from '@/i18n/pt-BR'
import { getErrorMessage } from '@/lib/errors'
import { useAuthStore } from '@/store/authStore'
import { toastSuccess } from '@/store/toastStore'
import {
  Button,
  ErrorBanner,
  Field,
  PageHeader,
  Panel,
  TextInput,
} from '@/components/ui-legacy'
import type { MfaEnrollPayload } from '@/api/auth'

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
      setMessage(strings.security.enrollSuccess)
      toastSuccess(strings.security.enrollSuccess)
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
      setMessage(strings.security.disableSuccess)
      toastSuccess(strings.security.disableSuccess)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const mfaEnabled = user?.mfa_enabled === true

  return (
    <div className="stack">
      <PageHeader title={strings.security.title} />

      <Panel title={strings.security.mfaStatus}>
        <p className="muted">
          Status:{' '}
          <strong>
            {mfaEnabled
              ? strings.security.mfaEnabled
              : strings.security.mfaDisabled}
          </strong>
        </p>

        <div className="form-actions" style={{ justifyContent: 'flex-start' }}>
          {!mfaEnabled ? (
            <Button onClick={() => void handleEnroll()} disabled={busy}>
              {strings.security.enroll}
            </Button>
          ) : (
            <Button
              variant="danger"
              onClick={() => void handleDisable()}
              disabled={busy}
            >
              {strings.security.disable}
            </Button>
          )}
        </div>
      </Panel>

      {enroll ? (
        <Panel title={strings.security.enroll}>
          <p className="muted">{strings.security.qrHint}</p>
          <div className="qr-wrap">
            <QRCodeSVG value={enroll.otpauth_uri} size={192} />
          </div>
          <Field label={strings.security.secretLabel}>
            <code className="mono secret-box">{enroll.secret}</code>
          </Field>
          <p className="muted small">{strings.security.codeHint}</p>
          <form
            className="form-grid"
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
            <div className="form-actions">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEnroll(null)}
              >
                {strings.common.cancel}
              </Button>
              <Button type="submit" disabled={busy}>
                {strings.security.confirm}
              </Button>
            </div>
          </form>
        </Panel>
      ) : null}

      {error ? <ErrorBanner message={error} /> : null}
      {message ? <p className="success-banner">{message}</p> : null}
    </div>
  )
}
