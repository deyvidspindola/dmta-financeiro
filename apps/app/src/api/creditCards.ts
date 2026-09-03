import { http, unwrapData } from '@/api/http';
import { mapCardInvoice, mapCardPurchase, mapCreditCard } from '@/api/mappers';
import type { CardInvoice, CardPurchase, CreditCard } from '@/types/models';

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

/** Debita a fatura da conta informada e marca como paga. */
export async function payCardInvoice(
  contextId: string,
  creditCardId: string,
  invoiceId: string,
  accountId: string,
): Promise<void> {
  await http.post(
    `/contexts/${contextId}/credit-cards/${creditCardId}/invoices/${invoiceId}/pay`,
    { account_id: accountId },
  );
}

export async function deleteCreditCard(
  contextId: string,
  creditCardId: string,
  force = false,
): Promise<void> {
  const query = force ? '?force=1' : '';
  await http.delete(`/contexts/${contextId}/credit-cards/${creditCardId}${query}`);
}

export async function listCardPurchases(
  contextId: string,
  creditCardId: string,
  invoiceId?: string,
): Promise<CardPurchase[]> {
  const query = invoiceId ? `?invoice_id=${invoiceId}` : '';
  const payload = await http.get<
    Parameters<typeof mapCardPurchase>[1][] | { data: Parameters<typeof mapCardPurchase>[1][] }
  >(`/contexts/${contextId}/credit-cards/${creditCardId}/purchases${query}`);
  return unwrapData(payload).map((row) => mapCardPurchase(creditCardId, row));
}

export type CardPurchaseInput = {
  description: string;
  amount: number;
  occurred_at: string;
  category_id: string | null;
  installments?: number;
};

export async function createCardPurchase(
  contextId: string,
  creditCardId: string,
  input: CardPurchaseInput,
): Promise<CardPurchase> {
  const payload = await http.post<
    Parameters<typeof mapCardPurchase>[1] | { data: Parameters<typeof mapCardPurchase>[1] }
  >(`/contexts/${contextId}/credit-cards/${creditCardId}/purchases`, {
    ...input,
    category_id: input.category_id ?? undefined,
  });
  return mapCardPurchase(creditCardId, unwrapData(payload));
}

export async function updateCardPurchase(
  contextId: string,
  creditCardId: string,
  purchaseId: string,
  input: Omit<CardPurchaseInput, 'installments'>,
): Promise<CardPurchase> {
  const payload = await http.patch<
    Parameters<typeof mapCardPurchase>[1] | { data: Parameters<typeof mapCardPurchase>[1] }
  >(`/contexts/${contextId}/credit-cards/${creditCardId}/purchases/${purchaseId}`, {
    ...input,
    category_id: input.category_id ?? undefined,
  });
  return mapCardPurchase(creditCardId, unwrapData(payload));
}
