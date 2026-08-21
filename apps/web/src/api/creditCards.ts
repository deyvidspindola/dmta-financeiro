import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import { mockApi } from '@/mocks/store'
import type { CardInvoice, CreditCard } from '@/types/models'

export type CreateCreditCardInput = Omit<CreditCard, 'id' | 'context_id'>

export async function listCreditCards(
  contextId: string,
): Promise<CreditCard[]> {
  if (useMocks) return mockApi.listCreditCards(contextId)
  return unwrapData(
    await http.get<CreditCard[] | { data: CreditCard[] }>(
      `/api/v1/contexts/${contextId}/credit-cards`,
    ),
  )
}

export async function createCreditCard(
  contextId: string,
  payload: CreateCreditCardInput,
): Promise<CreditCard> {
  if (useMocks) return mockApi.createCreditCard(contextId, payload)
  return unwrapData(
    await http.post<CreditCard | { data: CreditCard }>(
      `/api/v1/contexts/${contextId}/credit-cards`,
      payload,
    ),
  )
}

export async function listCardInvoices(
  contextId: string,
): Promise<CardInvoice[]> {
  if (useMocks) return mockApi.listInvoices(contextId)
  return unwrapData(
    await http.get<CardInvoice[] | { data: CardInvoice[] }>(
      `/api/v1/contexts/${contextId}/card-invoices`,
    ),
  )
}
