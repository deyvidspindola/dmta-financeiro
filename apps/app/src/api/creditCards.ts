import { http, unwrapData } from '@/api/http';
import { mapCardInvoice, mapCreditCard } from '@/api/mappers';
import type { CardInvoice, CreditCard } from '@/types/models';

type RawCard = Parameters<typeof mapCreditCard>[1] & { context?: { id: string | number; name: string } | null };

export async function listCreditCards(contextId: string): Promise<CreditCard[]> {
  const payload = await http.get<RawCard[] | { data: RawCard[] }>(
    `/contexts/${contextId}/credit-cards`,
  );
  return unwrapData(payload).map((row) => mapCreditCard(contextId, row));
}

/** Cartões de todos os contextos do usuário (modo Consolidado). */
export async function listConsolidatedCreditCards(): Promise<CreditCard[]> {
  const payload = await http.get<RawCard[] | { data: RawCard[] }>('/consolidated/credit-cards');
  return unwrapData(payload).map((row) =>
    mapCreditCard(String(row.context?.id ?? ''), row),
  );
}

export async function listCardInvoices(
  contextId: string,
  creditCardId: string,
): Promise<CardInvoice[]> {
  const payload = await http.get<
    Parameters<typeof mapCardInvoice>[2][] | { data: Parameters<typeof mapCardInvoice>[2][] }
  >(`/contexts/${contextId}/credit-cards/${creditCardId}/invoices`);
  return unwrapData(payload).map((row) => mapCardInvoice(contextId, creditCardId, row));
}
