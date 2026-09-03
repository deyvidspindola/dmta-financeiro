/**
 * Decide se uma notificação capturada pelo listener Android interessa
 * (parece movimentação de dinheiro de um app de banco/carteira) e a
 * transforma no item que vai pra fila local até o app sincronizar com a
 * API. A interpretação de verdade (valor, tipo, descrição) é do backend
 * — aqui é só filtro + normalização.
 */

import type { HeadlessNotificationEvent } from 'expo-notification-listener';
import { enqueueCapture, type QueuedCapture } from '@/lib/notificationCaptureQueue';

/** Apps cujas notificações quase sempre são financeiras. */
const BANK_PACKAGES = new Set([
  'com.nubank.app',
  'com.nu.production',
  'br.com.intermedium',
  'com.c6bank.app',
  'com.itau',
  'com.itau.empresas',
  'com.bradesco',
  'com.bradesco.next',
  'br.com.bb.android',
  'com.santander.app',
  'com.picpay',
  'com.mercadopago.wallet',
  'br.com.mobits.mercadopago',
  'com.google.android.apps.walletnfcrel',
  'br.gov.caixa.tem',
  'br.com.gabba.Caixa',
  'com.willbank',
  'com.original.bank',
  'com.neon.app',
  'br.com.digio',
  'com.xp.investimentos',
  'br.com.pagbank',
  'com.paypal.android.p2pmobile',
]);

const MONEY_RE = /R\$\s?\d/;
const TX_KEYWORDS =
  /(compra|pagamento|pagou|pix|transfer|recebi|recebeu|débito|debito|crédito|credito|aprovada|fatura|boleto|saque|dep[óo]sito|estorno|cashback|sal[áa]rio)/i;

export function isFinancialNotification(packageName: string, title: string, body: string): boolean {
  const text = `${title} ${body}`;
  if (!MONEY_RE.test(text)) return false;
  return BANK_PACKAGES.has(packageName) || TX_KEYWORDS.test(text);
}

type RawNotification = {
  packageName: string;
  appName?: string | null;
  title?: string | null;
  text?: string | null;
  bigText?: string | null;
  timestamp?: number | null;
};

/** Normaliza + enfileira se for financeira. Retorna `true` se enfileirou. */
export async function captureIfFinancial(n: RawNotification): Promise<boolean> {
  const title = n.title?.trim() ?? '';
  const body = (n.bigText?.trim() || n.text?.trim()) ?? '';
  if (!body) return false;
  if (!isFinancialNotification(n.packageName, title, body)) return false;

  const item: QueuedCapture = {
    package_name: n.packageName,
    app_label: n.appName ?? null,
    title: title || null,
    body,
    posted_at: n.timestamp ?? Date.now(),
  };
  await enqueueCapture(item);
  return true;
}

/** Task headless — roda com o app fechado/em segundo plano. */
export async function handleCapturedNotification(event: HeadlessNotificationEvent): Promise<void> {
  if (event.eventName !== 'notificationReceived') return;
  await captureIfFinancial(event);
}
