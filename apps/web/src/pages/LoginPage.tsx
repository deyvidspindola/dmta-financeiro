import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { authApi } from '@/api'
import { isMfaChallenge } from '@/types/models'
import { strings } from '@/i18n/pt-BR'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/cn'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore, type ThemePref } from '@/store/themeStore'
import { Alert, Button, Card, Field, TextInput } from '@/components/ui'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, strings.common.required),
})

const mfaSchema = z.object({
  code: z.string().min(6, strings.common.required).max(8),
})

type LoginValues = z.infer<typeof loginSchema>
type MfaValues = z.infer<typeof mfaSchema>

const THEME_OPTIONS: { value: ThemePref; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: strings.theme.light, icon: Sun },
  { value: 'dark', label: strings.theme.dark, icon: Moon },
  { value: 'system', label: strings.theme.system, icon: Monitor },
]

export function LoginPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const { pref, setPref } = useThemeStore()
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
    <div className="relative flex min-h-dvh items-center justify-center bg-canvas px-4 py-10 text-fg">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -left-1/4 top-0 size-[480px] rounded-full bg-brand-500/8 blur-3xl dark:bg-brand-500/12" />
        <div className="absolute -right-1/4 bottom-0 size-[400px] rounded-full bg-accent-500/8 blur-3xl dark:bg-accent-500/12" />
      </div>

      <Card className="relative z-10 w-full max-w-sm" padded>
        <header className="mb-6 text-center">
          <p className="font-mono text-xs font-semibold tracking-widest text-brand-600 dark:text-brand-400">
            {strings.shell.brandShort}
          </p>
          <h1 className="mt-1 font-display text-xl font-bold text-fg">
            {strings.appName}
          </h1>
          <p className="mt-1 text-sm text-fg-muted">{strings.appTagline}</p>
        </header>

        {!mfaToken ? (
          <form
            className="flex flex-col gap-4"
            onSubmit={loginForm.handleSubmit(onLogin)}
          >
            <h2 className="sr-only">{strings.auth.title}</h2>
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
            {error ? <Alert tone="danger">{error}</Alert> : null}
            <Button
              type="submit"
              block
              loading={loginForm.formState.isSubmitting}
            >
              {strings.auth.submit}
            </Button>
          </form>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={mfaForm.handleSubmit(onMfa)}
          >
            <div className="text-center">
              <h2 className="font-display text-base font-semibold text-fg">
                {strings.auth.mfaTitle}
              </h2>
              <p className="mt-1 text-sm text-fg-muted">{strings.auth.mfaHint}</p>
            </div>
            <Field
              label={strings.auth.mfaCode}
              error={mfaForm.formState.errors.code?.message}
            >
              <TextInput
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className="text-center text-lg tracking-[0.3em]"
                {...mfaForm.register('code')}
              />
            </Field>
            {error ? <Alert tone="danger">{error}</Alert> : null}
            <Button
              type="submit"
              block
              loading={mfaForm.formState.isSubmitting}
            >
              {strings.auth.mfaSubmit}
            </Button>
            <Button
              type="button"
              variant="ghost"
              block
              onClick={() => {
                setMfaToken(null)
                setError(null)
              }}
            >
              {strings.auth.mfaBack}
            </Button>
          </form>
        )}

        <footer className="mt-6 border-t border-line pt-4">
          <div
            className="flex justify-center gap-1"
            role="group"
            aria-label={strings.theme.label}
          >
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                title={opt.label}
                aria-label={opt.label}
                aria-pressed={pref === opt.value}
                className={cn(
                  'inline-flex size-9 items-center justify-center rounded-lg transition',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
                  pref === opt.value
                    ? 'bg-brand-500/12 text-brand-700 dark:text-brand-300'
                    : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
                )}
                onClick={() => setPref(opt.value)}
              >
                <opt.icon size={16} aria-hidden />
              </button>
            ))}
          </div>
        </footer>
      </Card>
    </div>
  )
}
