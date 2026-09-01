import { currentMonthKey } from '@/lib/dates'
import type { CardInvoice } from '@/types/models'

export const FUTURE_INVOICE_MONTHS = 3

export type InvoiceTimelineEntry = {
  reference_month: string
  invoice: CardInvoice | null
  isSynthetic: boolean
  due_date: string
}

/** Desloca uma chave YYYY-MM por `delta` meses. */
export function shiftMonthKey(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split('-').map(Number)
  if (!year || !month) return monthKey
  const date = new Date(year, month - 1 + delta, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/** Mês abreviado para chips — ex. "Set". */
export function formatMonthAbbrev(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  if (!year || !month) return monthKey
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
    .format(new Date(year, month - 1, 1))
    .replace('.', '')
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/** Data curta — ex. "10/out". */
export function formatDateShort(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  if (!year || !month || !day) return iso
  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
    .format(new Date(year, month - 1, day))
    .replace('.', '')
  return `${day}/${monthLabel}`
}

function computeDueDate(referenceMonth: string, dueDay: number): string {
  const [year, month] = referenceMonth.split('-').map(Number)
  if (!year || !month) return referenceMonth
  const lastDay = new Date(year, month, 0).getDate()
  const day = Math.min(Math.max(1, dueDay), lastDay)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * Linha do tempo de faturas: da mais antiga até a âncora (aberta ou mais
 * recente) + 3 meses futuros. Meses sem fatura real viram entrada sintética.
 */
export function buildInvoiceTimeline(
  invoices: CardInvoice[],
  dueDay: number,
): InvoiceTimelineEntry[] {
  const byMonth = new Map(
    invoices.map((invoice) => [invoice.reference_month, invoice]),
  )
  const sorted = [...invoices].sort((a, b) =>
    a.reference_month.localeCompare(b.reference_month),
  )

  const openInvoice = invoices.find((invoice) => invoice.status === 'open')
  const anchorMonth =
    openInvoice?.reference_month ??
    sorted[sorted.length - 1]?.reference_month ??
    currentMonthKey()

  const startMonth = sorted[0]?.reference_month ?? anchorMonth
  const endMonth = shiftMonthKey(anchorMonth, FUTURE_INVOICE_MONTHS)

  const result: InvoiceTimelineEntry[] = []
  let cursor = startMonth
  while (cursor <= endMonth) {
    const invoice = byMonth.get(cursor) ?? null
    result.push({
      reference_month: cursor,
      invoice,
      isSynthetic: invoice === null,
      due_date: invoice?.due_date ?? computeDueDate(cursor, dueDay),
    })
    cursor = shiftMonthKey(cursor, 1)
  }
  return result
}

/** Mês inicial da faixa: fatura aberta ou a mais recente. */
export function findDefaultInvoiceMonth(
  invoices: CardInvoice[],
  timeline: InvoiceTimelineEntry[],
): string {
  const open = invoices.find((invoice) => invoice.status === 'open')
  if (open) return open.reference_month

  const realMonths = timeline
    .filter((entry) => entry.invoice)
    .map((entry) => entry.reference_month)
  if (realMonths.length > 0) return realMonths[realMonths.length - 1]!

  const anchorIdx = Math.max(0, timeline.length - FUTURE_INVOICE_MONTHS - 1)
  return timeline[anchorIdx]?.reference_month ?? currentMonthKey()
}
