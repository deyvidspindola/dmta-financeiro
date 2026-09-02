import { DEVICE_NAME } from '@/api/config';
import { http, unwrapData } from '@/api/http';
import { mapContext, mapUser } from '@/api/mappers';
import type { AuthSession, LoginCredentials, LoginResult, MfaChallenge } from '@/types/models';

type ApiUser = {
  id: string | number;
  name: string;
  email: string;
  mfa_enabled?: boolean;
};

type ApiLoginResponse =
  | { mfa_required: false; token: string; user: ApiUser }
  | { mfa_required: true; mfa_token: string }
  // Shape retrocompatível sem mfa_required
  | { token: string; user: ApiUser };

async function fetchSession(token: string): Promise<AuthSession> {
  const [me, contextsPayload] = await Promise.all([
    http.get<ApiUser>('/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
    http.get<Parameters<typeof mapContext>[0][] | { data: Parameters<typeof mapContext>[0][] }>(
      '/contexts',
      { headers: { Authorization: `Bearer ${token}` } },
    ),
  ]);

  return {
    token,
    user: mapUser(me),
    contexts: unwrapData(contextsPayload).map(mapContext),
  };
}

export async function login(credentials: LoginCredentials): Promise<LoginResult> {
  const raw = await http.post<ApiLoginResponse>('/auth/login', {
    email: credentials.email,
    password: credentials.password,
    device_name: DEVICE_NAME,
  });

  if ('mfa_required' in raw && raw.mfa_required === true) {
    const challenge: MfaChallenge = { mfa_required: true, mfa_token: raw.mfa_token };
    return challenge;
  }

  if (!('token' in raw)) {
    throw new Error('Unexpected login response');
  }

  return fetchSession(raw.token);
}

export async function verifyMfa(mfaToken: string, code: string): Promise<AuthSession> {
  const raw = await http.post<{ token: string; user: ApiUser }>(
    '/auth/mfa/verify',
    { code, device_name: DEVICE_NAME },
    { headers: { Authorization: `Bearer ${mfaToken}` } },
  );
  return fetchSession(raw.token);
}

export async function logout(): Promise<void> {
  await http.post('/auth/logout');
}
