import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import { mapCreditCard, toCreateCreditCardBody } from '@/api/mappers'
import { mockApi } from '@/mocks/store'
import type { CardInvoice, CreditCard } from '@/types/models'

export type CreateCreditCardInput = Omit<CreditCard, 'id' | 'context_id'>

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

/** Card invoices are not exposed by the API in F0 yet. */
export async function listCardInvoices(
  contextId: string,
): Promise<CardInvoice[]> {
  if (useMocks) return mockApi.listInvoices(contextId)
  return []
}
