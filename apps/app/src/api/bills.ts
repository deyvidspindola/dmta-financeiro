import { http, unwrapData } from '@/api/http';
import { mapBill, toCreateBillBody, toPayBillBody, toUpdateBillBody } from '@/api/mappers';
import type { Bill, BillKind } from '@/types/models';

export type BillListFilters = { from?: string; to?: string; status?: string };

export type BillInput = {
  description: string;
  amount: number;
  due_date: string;
  kind: BillKind;
  category_id: string | null;
  barcode: string | null;
};

export async function listBills(contextId: string, filters: BillListFilters = {}): Promise<Bill[]> {
  const params = new URLSearchParams();
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.status) params.set('status', filters.status);
  const qs = params.toString();
  const payload = await http.get<
    Parameters<typeof mapBill>[1][] | { data: Parameters<typeof mapBill>[1][] }
  >(`/contexts/${contextId}/bills${qs ? `?${qs}` : ''}`);
  return unwrapData(payload).map((row) => mapBill(contextId, row));
}

export async function createBill(contextId: string, input: BillInput): Promise<Bill> {
  const payload = await http.post<
    Parameters<typeof mapBill>[1] | { data: Parameters<typeof mapBill>[1] }
  >(`/contexts/${contextId}/bills`, toCreateBillBody(input));
  return mapBill(contextId, unwrapData(payload));
}

export async function updateBill(
  contextId: string,
  billId: string,
  input: Omit<BillInput, 'kind'>,
): Promise<Bill> {
  const payload = await http.patch<
    Parameters<typeof mapBill>[1] | { data: Parameters<typeof mapBill>[1] }
  >(`/contexts/${contextId}/bills/${billId}`, toUpdateBillBody(input));
  return mapBill(contextId, unwrapData(payload));
}

export async function payBill(
  contextId: string,
  billId: string,
  accountId: string,
  occurredAt: string | null = null,
): Promise<void> {
  await http.post(
    `/contexts/${contextId}/bills/${billId}/pay`,
    toPayBillBody({ account_id: accountId, occurred_at: occurredAt }),
  );
}

export async function deleteBill(contextId: string, billId: string): Promise<void> {
  await http.delete(`/contexts/${contextId}/bills/${billId}`);
}
