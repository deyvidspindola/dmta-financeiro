import { API_BASE_URL } from '@/api/config';

/**
 * Cliente HTTP — porte do apps/web/src/api/http.ts, sem dependência de DOM.
 * Diferenças:
 *  - base URL vem de `EXPO_PUBLIC_API_BASE_URL` (não `import.meta.env`)
 *  - sem `http.download` (usava `document.createElement('a')`) — quando o app
 *    precisar baixar arquivo, usar `expo-file-system` + `expo-sharing`.
 *  - o token vem do store via `bindAuthToken` (hidratado do SecureStore).
 */

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

type TokenGetter = () => string | null;

let getToken: TokenGetter = () => null;

export function bindAuthToken(getter: TokenGetter): void {
  getToken = getter;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
  if (init.body && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const body = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const message =
      typeof body === 'object' &&
      body !== null &&
      'message' in body &&
      typeof (body as { message: unknown }).message === 'string'
        ? (body as { message: string }).message
        : `HTTP ${response.status}`;
    throw new ApiError(response.status, message, body);
  }

  return body as T;
}

export const http = {
  get: <T>(path: string, init?: RequestInit) => request<T>(path, init),
  post: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, {
      ...init,
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  postForm: <T>(path: string, body: FormData) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, {
      ...init,
      method: 'PUT',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, {
      ...init,
      method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  delete: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: 'DELETE' }),
};

/** Desembrulha envelopes Laravel `{ data: T }` quando presentes. */
export function unwrapData<T>(payload: T | { data: T }): T {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'data' in payload &&
    (payload as { data: T }).data !== undefined
  ) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}
