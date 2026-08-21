import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import {
  mapCardInvoice,
  mapCreditCard,
  toCreateCardInvoiceBody,
  toCreateCreditCardBody,
} from '@/api/mappers'
import { mockApi } from '@/mocks/store'
import type { CardInvoice, CreditCard } from '@/types/models'

export type CreateCreditCardInput = Omit<CreditCard, 'id' | 'context_id'>

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
