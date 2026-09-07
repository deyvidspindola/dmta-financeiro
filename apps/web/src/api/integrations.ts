import { http, unwrapData } from '@/api/http'

/**
 * Configuração das integrações da F1 (bot do Telegram, caixa IMAP de
 * boletos). Sempre bate na API real — configuração não faz sentido em
 * modo mock.
 */

export type IntegrationSettings = {
  telegram: {
    configured: boolean
    bot_token_set: boolean
    bot_token_from_env: boolean
    webhook_secret_set: boolean
    allowed_chat_id: string | null
    user_email: string | null
    webhook_registered_at: string | null
    webhook_url: string
  }
  boleto_mailbox: {
    enabled: boolean
    host: string | null
    port: number
    encryption: string
    username: string | null
    password_set: boolean
    password_from_env: boolean
  }
}

export type UpdateIntegrationsInput = {
  telegram_bot_token?: string | null
  telegram_webhook_secret?: string | null
  telegram_allowed_chat_id?: string | null
  telegram_user_email?: string | null
  boleto_mailbox_enabled?: boolean
  boleto_mailbox_host?: string | null
  boleto_mailbox_port?: number
  boleto_mailbox_encryption?: string
  boleto_mailbox_username?: string | null
  boleto_mailbox_password?: string | null
}

export type ActionResult = {
  ok: boolean
  error?: string
  bot?: string | null
  message_sent?: boolean
  url?: string
  unseen?: number
}

export type WebhookInfo = {
  ok: boolean
  error?: string
  result?: {
    url?: string
    pending_update_count?: number
    last_error_message?: string
    last_error_date?: number
    ip_address?: string
  }
}

export async function getIntegrations(): Promise<IntegrationSettings> {
  return unwrapData(
    await http.get<IntegrationSettings | { data: IntegrationSettings }>(
      '/integrations',
    ),
  )
}

export async function updateIntegrations(
  payload: UpdateIntegrationsInput,
): Promise<IntegrationSettings> {
  return unwrapData(
    await http.put<IntegrationSettings | { data: IntegrationSettings }>(
      '/integrations',
      payload,
    ),
  )
}

export async function testTelegram(): Promise<ActionResult> {
  return http.post<ActionResult>('/integrations/telegram/test')
}

export async function registerTelegramWebhook(): Promise<ActionResult> {
  return http.post<ActionResult>('/integrations/telegram/webhook')
}

export async function getTelegramWebhookInfo(): Promise<WebhookInfo> {
  return http.get<WebhookInfo>('/integrations/telegram/webhook-info')
}

export async function testBoletoMailbox(): Promise<ActionResult> {
  return http.post<ActionResult>('/integrations/boleto-mailbox/test')
}
