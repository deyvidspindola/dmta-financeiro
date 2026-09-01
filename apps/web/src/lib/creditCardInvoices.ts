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
 * A fatura "de agora" — a que você olha ao abrir a tela: a do ciclo
 * corrente se existir, senão a fatura mais antiga ainda não paga
 * (fechada ou aberta), senão a mais recente. Como as faturas vêm
 * ordenadas desc da API, ordenamos asc aqui pra pegar a mais antiga.
 */
export function findDefaultInvoiceMonth(
  invoices: CardInvoice[],
  _timeline?: InvoiceTimelineEntry[],
): string {
  const asc = [...invoices].sort((a, b) =>
    a.reference_month.localeCompare(b.reference_month),
  )
  const thisMonth = currentMonthKey()

  const current = asc.find((invoice) => invoice.reference_month === thisMonth)
  if (current) return current.reference_month

  const oldestUnpaid = asc.find((invoice) => invoice.status !== 'paid')
  if (oldestUnpaid) return oldestUnpaid.reference_month

  return asc[asc.length - 1]?.reference_month ?? thisMonth
}

/**
 * Linha do tempo de faturas: da mais antiga até `max(última fatura real,
 * fatura de agora + 3 meses)`. Meses sem fatura real viram entrada
 * sintética ("prevista").
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

  const anchorMonth = findDefaultInvoiceMonth(invoices)
  const lastRealMonth = sorted[sorted.length - 1]?.reference_month ?? anchorMonth

  const startMonth = sorted[0]?.reference_month ?? anchorMonth
  const projectedEnd = shiftMonthKey(anchorMonth, FUTURE_INVOICE_MONTHS)
  const endMonth = projectedEnd > lastRealMonth ? projectedEnd : lastRealMonth

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
