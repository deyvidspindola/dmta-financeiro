import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { integrationsApi } from '@/api'
import type {
  ActionResult,
  IntegrationSettings,
  UpdateIntegrationsInput,
  WebhookInfo,
} from '@/api/integrations'
import {
  Alert,
  Button,
  Card,
  CardHeader,
  Field,
  LoadingBlock,
  PageHeader,
  SwitchField,
  TextInput,
  TextSelect,
} from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { getErrorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/format'
import { toastError, toastSuccess } from '@/store/toastStore'

const t = strings.integrations

export function IntegrationsPage() {
  const query = useQuery({
    queryKey: ['integrations'],
    queryFn: integrationsApi.getIntegrations,
  })

  return (
    <div className="space-y-6 bg-canvas text-fg">
      <PageHeader title={t.title} description={t.hint} />

      {query.isLoading ? (
        <LoadingBlock label={strings.common.loading} />
      ) : query.isError ? (
        <Alert tone="danger">{getErrorMessage(query.error)}</Alert>
      ) : query.data ? (
        <>
          <TelegramSection data={query.data} />
          <MailboxSection data={query.data} />
        </>
      ) : null}
    </div>
  )
}

function useSave() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateIntegrationsInput) =>
      integrationsApi.updateIntegrations(payload),
    onSuccess: (fresh) => {
      queryClient.setQueryData(['integrations'], fresh)
      toastSuccess(t.saved)
    },
    onError: (error) => toastError(getErrorMessage(error)),
  })
}

function ResultBanner({ result }: { result: ActionResult | null }) {
  if (!result) return null
  if (!result.ok) {
    return <Alert tone="danger">{t.testFail(result.error ?? '')}</Alert>
  }
  return null
}

function WebhookInfoView({ result }: { result: WebhookInfo['result'] }) {
  if (!result?.url) {
    return (
      <div className="mt-2 rounded-lg bg-negative/10 p-2 text-negative">
        {t.telegram.webhookInfoNoUrl}
      </div>
    )
  }
  return (
    <dl className="mt-2 space-y-0.5">
      <div>
        <dt className="inline font-medium">{t.telegram.webhookInfoUrl}: </dt>
        <dd className="inline break-all">{result.url}</dd>
      </div>
      <div>
        <dt className="inline font-medium">{t.telegram.webhookInfoPending}: </dt>
        <dd className="inline">{result.pending_update_count ?? 0}</dd>
      </div>
      <div>
        <dt className="inline font-medium">{t.telegram.webhookInfoLastError}: </dt>
        <dd className={result.last_error_message ? 'inline text-negative' : 'inline'}>
          {result.last_error_message ?? t.telegram.webhookInfoNoError}
        </dd>
      </div>
    </dl>
  )
}

function TelegramSection({ data }: { data: IntegrationSettings }) {
  const tg = data.telegram
  const save = useSave()
  const [botToken, setBotToken] = useState('')
  const [chatId, setChatId] = useState(tg.allowed_chat_id ?? '')
  const [email, setEmail] = useState(tg.user_email ?? '')
  const [result, setResult] = useState<ActionResult | null>(null)

  const test = useMutation({
    mutationFn: integrationsApi.testTelegram,
    onSuccess: (r) => {
      setResult(r)
      if (r.ok) {
        toastSuccess(
          r.message_sent ? t.telegram.testOkWithMessage(r.bot) : t.telegram.testOk(r.bot),
        )
      }
    },
    onError: (error) => setResult({ ok: false, error: getErrorMessage(error) }),
  })

  const webhook = useMutation({
    mutationFn: integrationsApi.registerTelegramWebhook,
    onSuccess: (r) => {
      setResult(r)
      if (r.ok) toastSuccess(t.telegram.webhookOk)
    },
    onError: (error) => setResult({ ok: false, error: getErrorMessage(error) }),
  })

  const [webhookInfo, setWebhookInfo] = useState<WebhookInfo | null>(null)
  const info = useMutation({
    mutationFn: integrationsApi.getTelegramWebhookInfo,
    onSuccess: (r) => {
      setWebhookInfo(r)
      if (!r.ok) setResult({ ok: false, error: r.error })
    },
    onError: (error) => setResult({ ok: false, error: getErrorMessage(error) }),
  })

  function handleSave() {
    const payload: UpdateIntegrationsInput = {
      telegram_allowed_chat_id: chatId.trim() || null,
      telegram_user_email: email.trim() || null,
    }
    if (botToken.trim()) payload.telegram_bot_token = botToken.trim()
    save.mutate(payload, { onSuccess: () => setBotToken('') })
  }

  const tokenPlaceholder = tg.bot_token_set
    ? t.telegram.botTokenPlaceholderSet
    : tg.bot_token_from_env
      ? t.telegram.botTokenPlaceholderEnv
      : t.telegram.botTokenPlaceholderEmpty

  return (
    <Card>
      <CardHeader title={t.telegram.title} description={t.telegram.hint} />
      <div className="space-y-4">
        <Field label={t.telegram.botToken}>
          <TextInput
            type="password"
            autoComplete="off"
            value={botToken}
            placeholder={tokenPlaceholder}
            onChange={(e) => setBotToken(e.target.value)}
          />
        </Field>
        <Field label={t.telegram.allowedChatId} hint={t.telegram.allowedChatIdHint}>
          <TextInput value={chatId} onChange={(e) => setChatId(e.target.value)} />
        </Field>
        <Field label={t.telegram.userEmail} hint={t.telegram.userEmailHint}>
          <TextInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <div className="rounded-xl border border-line bg-surface-2 p-3 text-xs text-fg-muted">
          <div className="font-medium text-fg">{t.telegram.webhookUrl}</div>
          <code className="break-all">{tg.webhook_url}</code>
          <div className="mt-1">
            {tg.webhook_registered_at
              ? t.telegram.webhookRegistered(formatDate(tg.webhook_registered_at))
              : t.telegram.webhookNotRegistered}
          </div>
          <button
            type="button"
            className="mt-2 font-medium text-brand-600 hover:underline disabled:opacity-50"
            onClick={() => info.mutate()}
            disabled={!tg.configured || info.isPending}
          >
            {t.telegram.webhookStatus}
          </button>
          {webhookInfo?.ok ? (
            <WebhookInfoView result={webhookInfo.result} />
          ) : null}
        </div>

        <ResultBanner result={result} />

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSave} loading={save.isPending}>
            {t.save}
          </Button>
          <Button
            variant="secondary"
            onClick={() => test.mutate()}
            loading={test.isPending}
            disabled={!tg.configured}
          >
            {t.testConnection}
          </Button>
          <Button
            variant="ghost"
            onClick={() => webhook.mutate()}
            loading={webhook.isPending}
            disabled={!tg.configured}
          >
            {t.telegram.registerWebhook}
          </Button>
        </div>
      </div>
    </Card>
  )
}

const ENCRYPTIONS = ['ssl', 'tls', 'starttls', 'none']

function MailboxSection({ data }: { data: IntegrationSettings }) {
  const mb = data.boleto_mailbox
  const save = useSave()
  const [enabled, setEnabled] = useState(mb.enabled)
  const [host, setHost] = useState(mb.host ?? '')
  const [port, setPort] = useState(String(mb.port))
  const [encryption, setEncryption] = useState(mb.encryption)
  const [username, setUsername] = useState(mb.username ?? '')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState<ActionResult | null>(null)

  const test = useMutation({
    mutationFn: integrationsApi.testBoletoMailbox,
    onSuccess: (r) => {
      setResult(r)
      if (r.ok) toastSuccess(t.mailbox.testOk(r.unseen ?? 0))
    },
    onError: (error) => setResult({ ok: false, error: getErrorMessage(error) }),
  })

  function handleSave() {
    const payload: UpdateIntegrationsInput = {
      boleto_mailbox_enabled: enabled,
      boleto_mailbox_host: host.trim() || null,
      boleto_mailbox_port: Number(port) || 993,
      boleto_mailbox_encryption: encryption,
      boleto_mailbox_username: username.trim() || null,
    }
    if (password.trim()) payload.boleto_mailbox_password = password.trim()
    save.mutate(payload, { onSuccess: () => setPassword('') })
  }

  const passwordPlaceholder = mb.password_set
    ? t.mailbox.passwordPlaceholderSet
    : mb.password_from_env
      ? t.mailbox.passwordPlaceholderEnv
      : ''

  return (
    <Card>
      <CardHeader title={t.mailbox.title} description={t.mailbox.hint} />
      <div className="space-y-4">
        <SwitchField
          label={t.mailbox.enabled}
          checked={enabled}
          onChange={setEnabled}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.mailbox.host}>
            <TextInput value={host} onChange={(e) => setHost(e.target.value)} />
          </Field>
          <Field label={t.mailbox.port}>
            <TextInput
              type="number"
              value={port}
              onChange={(e) => setPort(e.target.value)}
            />
          </Field>
          <Field label={t.mailbox.encryption}>
            <TextSelect
              value={encryption}
              onChange={(e) => setEncryption(e.target.value)}
            >
              {ENCRYPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </TextSelect>
          </Field>
          <Field label={t.mailbox.username}>
            <TextInput
              autoComplete="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </Field>
        </div>
        <Field label={t.mailbox.password}>
          <TextInput
            type="password"
            autoComplete="off"
            value={password}
            placeholder={passwordPlaceholder}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <ResultBanner result={result} />

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSave} loading={save.isPending}>
            {t.save}
          </Button>
          <Button
            variant="secondary"
            onClick={() => test.mutate()}
            loading={test.isPending}
          >
            {t.testConnection}
          </Button>
        </div>
      </div>
    </Card>
  )
}
