/**
 * Fila local (AsyncStorage) de notificações capturadas que ainda não
 * foram enviadas pra API. O listener nativo (foreground e headless)
 * escreve aqui; o app drena a fila quando abre / volta ao foco. Assim a
 * captura não depende de rede nem de sessão no momento em que a
 * notificação chega.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'notification-capture-queue';
const MAX_ITEMS = 300;

export type QueuedCapture = {
  package_name: string;
  app_label: string | null;
  title: string | null;
  body: string;
  /** ms desde a época. */
  posted_at: number;
};

function fingerprint(c: QueuedCapture): string {
  return `${c.package_name}|${c.body}|${Math.floor(c.posted_at / 60000)}`;
}

async function readAll(): Promise<QueuedCapture[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as QueuedCapture[]) : [];
  } catch {
    return [];
  }
}

async function writeAll(items: QueuedCapture[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(items.slice(-MAX_ITEMS)));
  } catch {
    // storage cheio / indisponível — perde a captura, sem quebrar o app
  }
}

export async function enqueueCapture(item: QueuedCapture): Promise<void> {
  const items = await readAll();
  const fp = fingerprint(item);
  if (items.some((i) => fingerprint(i) === fp)) return;
  items.push(item);
  await writeAll(items);
}

export async function peekQueue(): Promise<QueuedCapture[]> {
  return readAll();
}

/** Remove da fila os itens já aceitos pela API (por fingerprint). */
export async function dropFromQueue(sent: QueuedCapture[]): Promise<void> {
  if (sent.length === 0) return;
  const sentFps = new Set(sent.map(fingerprint));
  const remaining = (await readAll()).filter((i) => !sentFps.has(fingerprint(i)));
  await writeAll(remaining);
}

export async function clearQueue(): Promise<void> {
  await writeAll([]);
}
