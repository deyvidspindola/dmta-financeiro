import { http, unwrapData } from '@/api/http';
import type { QueuedCapture } from '@/lib/notificationCaptureQueue';

/** Notificação capturada, como a API devolve pra inbox. */
export type NotificationCapture = {
  id: string;
  package_name: string;
  app_label: string | null;
  title: string | null;
  body: string;
  posted_at: string;
  guessed_type: 'income' | 'expense' | null;
  guessed_amount: number | null;
  guessed_date: string | null;
  guessed_description: string | null;
  status: 'pending' | 'saved' | 'ignored';
  statement_entry_id: number | null;
  created_at: string;
};

type Raw = Omit<NotificationCapture, 'id' | 'statement_entry_id'> & {
  id: number;
  statement_entry_id: number | null;
};

function map(row: Raw): NotificationCapture {
  return { ...row, id: String(row.id) };
}

export async function listCaptures(
  status: 'pending' | 'saved' | 'ignored' | 'all' = 'pending',
): Promise<NotificationCapture[]> {
  const payload = await http.get<Raw[] | { data: Raw[] }>(
    `/notification-captures?status=${status}`,
  );
  return unwrapData(payload).map(map);
}

export async function ingestCaptures(
  items: QueuedCapture[],
): Promise<{ ingested: number; duplicates: number }> {
  return http.post<{ ingested: number; duplicates: number }>('/notification-captures', { items });
}

export type SaveCaptureInput = {
  context_id: string;
  account_id: string;
  category_id: string | null;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  occurred_at: string;
  force?: boolean;
};

export async function saveCapture(captureId: string, input: SaveCaptureInput): Promise<void> {
  await http.post(`/notification-captures/${captureId}/save`, input);
}

export async function ignoreCapture(captureId: string): Promise<void> {
  await http.post(`/notification-captures/${captureId}/ignore`);
}
