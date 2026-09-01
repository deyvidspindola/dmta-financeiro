import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { authApi } from '@/api'
import { isMfaChallenge } from '@/types/models'
import { strings } from '@/i18n/pt-BR'
import { getErrorMessage } from '@/lib/errors'
import { useAuthStore } from '@/store/authStore'
import { Button, ErrorBanner, Field, TextInput } from '@/components/ui-legacy'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, strings.common.required),
})

const mfaSchema = z.object({
  code: z.string().min(6, strings.common.required).max(8),
})

type LoginValues = z.infer<typeof loginSchema>
type MfaValues = z.infer<typeof mfaSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const [mfaToken, setMfaToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const mfaForm = useForm<MfaValues>({
    resolver: zodResolver(mfaSchema),
    defaultValues: { code: '' },
  })

  async function onLogin(values: LoginValues) {
    setError(null)
    try {
      const result = await authApi.login(values)
      if (isMfaChallenge(result)) {
        setMfaToken(result.mfa_token)
        mfaForm.reset({ code: '' })
        return
      }
      setSession(result)
      void navigate('/')
    } catch (err) {
      setError(getErrorMessage(err, strings.auth.invalidCredentials))
    }
  }

  async function onMfa(values: MfaValues) {
    if (!mfaToken) return
    setError(null)
    try {
      const session = await authApi.verifyMfa(mfaToken, values.code)
      setSession(session)
      void navigate('/')
    } catch (err) {
      setError(getErrorMessage(err, strings.auth.invalidMfa))
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-screen__panel">
        <p className="brand__mark">DMTA</p>
        <h1>{strings.appName}</h1>
        <p className="muted">{strings.appTagline}</p>

        {!mfaToken ? (
          <form
            className="form-grid"
            onSubmit={loginForm.handleSubmit(onLogin)}
          >
            <h2>{strings.auth.title}</h2>
            <Field
              label={strings.auth.email}
              error={loginForm.formState.errors.email?.message}
            >
              <TextInput
                type="email"
                autoComplete="username"
                {...loginForm.register('email')}
              />
            </Field>
            <Field
              label={strings.auth.password}
              error={loginForm.formState.errors.password?.message}
            >
              <TextInput
                type="password"
                autoComplete="current-password"
                {...loginForm.register('password')}
              />
            </Field>
            {error ? <ErrorBanner message={error} /> : null}
            <Button type="submit" disabled={loginForm.formState.isSubmitting}>
              {strings.auth.submit}
            </Button>
          </form>
        ) : (
          <form className="form-grid" onSubmit={mfaForm.handleSubmit(onMfa)}>
            <h2>{strings.auth.mfaTitle}</h2>
            <p className="muted">{strings.auth.mfaHint}</p>
            <Field
              label={strings.auth.mfaCode}
              error={mfaForm.formState.errors.code?.message}
            >
              <TextInput
                inputMode="numeric"
                autoComplete="one-time-code"
                {...mfaForm.register('code')}
              />
            </Field>
            {error ? <ErrorBanner message={error} /> : null}
            <div className="form-actions">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setMfaToken(null)
                  setError(null)
                }}
              >
                {strings.auth.mfaBack}
              </Button>
              <Button type="submit" disabled={mfaForm.formState.isSubmitting}>
                {strings.auth.mfaSubmit}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
