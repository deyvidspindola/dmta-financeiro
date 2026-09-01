import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import {
  asApiId,
  mapCardInvoice,
  mapCardPurchase,
  mapCreditCard,
  toCreateCardInvoiceBody,
  toCreateCreditCardBody,
  toUpdateCreditCardBody,
} from '@/api/mappers'
import { mockApi } from '@/mocks/store'
import type { CardInvoice, CardPurchase, CreditCard } from '@/types/models'

export type CreateCreditCardInput = Omit<
  CreditCard,
  | 'id'
  | 'context_id'
  | 'available_limit'
  | 'unpaid_invoices_total'
  | 'current_invoice_total'
>

export type CreateCardInvoiceInput = {
  reference_month: string
  amount: number
  due_date: string
}

export async function listCreditCards(
  contextId: string,
): Promise<CreditCard[]> {
  if (useMocks) return mockApi.listCreditCards(contextId)
  const payload = await http.get<
    | Array<Parameters<typeof mapCreditCard>[1]>
    | { data: Array<Parameters<typeof mapCreditCard>[1]> }
  >(`/contexts/${contextId}/credit-cards`)
  return unwrapData(payload).map((row) => mapCreditCard(contextId, row))
}

export async function createCreditCard(
  contextId: string,
  payload: CreateCreditCardInput,
): Promise<CreditCard> {
  if (useMocks) return mockApi.createCreditCard(contextId, payload)
  const created = unwrapData(
    await http.post<
      | Parameters<typeof mapCreditCard>[1]
      | { data: Parameters<typeof mapCreditCard>[1] }
    >(
      `/contexts/${contextId}/credit-cards`,
      toCreateCreditCardBody(payload),
    ),
  )
  return mapCreditCard(contextId, created)
}

export async function updateCreditCard(
  contextId: string,
  creditCardId: string,
  payload: CreateCreditCardInput,
): Promise<CreditCard> {
  if (useMocks) {
    return mockApi.updateCreditCard(contextId, creditCardId, payload)
  }
  const updated = unwrapData(
    await http.patch<
      | Parameters<typeof mapCreditCard>[1]
      | { data: Parameters<typeof mapCreditCard>[1] }
    >(
      `/contexts/${contextId}/credit-cards/${creditCardId}`,
      toUpdateCreditCardBody(payload),
    ),
  )
  return mapCreditCard(contextId, updated)
}

export async function deleteCreditCard(
  contextId: string,
  creditCardId: string,
): Promise<void> {
  if (useMocks) return mockApi.deleteCreditCard(contextId, creditCardId)
  await http.delete(`/contexts/${contextId}/credit-cards/${creditCardId}`)
}

export async function listCardInvoices(
  contextId: string,
): Promise<CardInvoice[]> {
  if (useMocks) return mockApi.listInvoices(contextId)

  const cards = await listCreditCards(contextId)
  const nested = await Promise.all(
    cards.map(async (card) => {
      const payload = await http.get<
        | Array<Parameters<typeof mapCardInvoice>[2]>
        | { data: Array<Parameters<typeof mapCardInvoice>[2]> }
      >(`/contexts/${contextId}/credit-cards/${card.id}/invoices`)
      return unwrapData(payload).map((row) =>
        mapCardInvoice(contextId, card.id, row),
      )
    }),
  )
  return nested.flat()
}

export async function createCardInvoice(
  contextId: string,
  creditCardId: string,
  payload: CreateCardInvoiceInput,
): Promise<CardInvoice> {
  if (useMocks) {
    return mockApi.createInvoice(contextId, creditCardId, payload)
  }
  const created = unwrapData(
    await http.post<
      | Parameters<typeof mapCardInvoice>[2]
      | { data: Parameters<typeof mapCardInvoice>[2] }
    >(
      `/contexts/${contextId}/credit-cards/${creditCardId}/invoices`,
      toCreateCardInvoiceBody(payload),
    ),
  )
  return mapCardInvoice(contextId, creditCardId, created)
}

/** Faturas de um cartão específico (não de todos, como listCardInvoices). */
export async function listInvoicesForCard(
  contextId: string,
  creditCardId: string,
): Promise<CardInvoice[]> {
  const payload = await http.get<
    | Array<Parameters<typeof mapCardInvoice>[2]>
    | { data: Array<Parameters<typeof mapCardInvoice>[2]> }
  >(`/contexts/${contextId}/credit-cards/${creditCardId}/invoices`)
  return unwrapData(payload).map((row) =>
    mapCardInvoice(contextId, creditCardId, row),
  )
}

export async function listCardPurchases(
  contextId: string,
  creditCardId: string,
  invoiceId?: string,
): Promise<CardPurchase[]> {
  const query = invoiceId ? `?invoice_id=${asApiId(invoiceId)}` : ''
  const payload = await http.get<
    | Array<Parameters<typeof mapCardPurchase>[1]>
    | { data: Array<Parameters<typeof mapCardPurchase>[1]> }
  >(`/contexts/${contextId}/credit-cards/${creditCardId}/purchases${query}`)
  return unwrapData(payload).map((row) => mapCardPurchase(creditCardId, row))
}

export type CreateCardPurchaseInput = {
  description: string
  amount: number
  occurred_at: string
  category_id?: string | null
  installments?: number
}

export async function createCardPurchase(
  contextId: string,
  creditCardId: string,
  input: CreateCardPurchaseInput,
): Promise<void> {
  await http.post(
    `/contexts/${contextId}/credit-cards/${creditCardId}/purchases`,
    {
      description: input.description,
      amount: input.amount,
      occurred_at: input.occurred_at,
      ...(input.category_id ? { category_id: asApiId(input.category_id) } : {}),
      ...(input.installments && input.installments > 1
        ? { installments: input.installments }
        : {}),
    },
  )
}

export async function deleteCardPurchase(
  contextId: string,
  creditCardId: string,
  purchaseId: string,
  scope?: 'group',
): Promise<void> {
  const query = scope ? '?scope=group' : ''
  await http.delete(
    `/contexts/${contextId}/credit-cards/${creditCardId}/purchases/${asApiId(purchaseId)}${query}`,
  )
}

export async function payCardInvoice(
  contextId: string,
  creditCardId: string,
  invoiceId: string,
  accountId: string,
  occurredAt?: string,
): Promise<void> {
  await http.post(
    `/contexts/${contextId}/credit-cards/${creditCardId}/invoices/${asApiId(invoiceId)}/pay`,
    {
      account_id: asApiId(accountId),
      ...(occurredAt ? { occurred_at: occurredAt } : {}),
    },
  )
}
