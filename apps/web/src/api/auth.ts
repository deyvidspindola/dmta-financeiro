import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import { mapContext, mapUser } from '@/api/mappers'
import { mockApi } from '@/mocks/store'
import type {
  AuthSession,
  LoginCredentials,
  LoginResult,
  MfaChallenge,
} from '@/types/models'

type ApiLoginResponse =
  | {
      token: string
      user: { id: string | number; name: string; email: string }
    }
  | MfaChallenge

async function fetchSession(token: string): Promise<AuthSession> {
  const [me, contextsPayload] = await Promise.all([
    http.get<{ id: string | number; name: string; email: string }>(
      '/auth/me',
      { headers: { Authorization: `Bearer ${token}` } },
    ),
    http.get<{ data: Array<Parameters<typeof mapContext>[0]> } | Array<Parameters<typeof mapContext>[0]>>(
      '/contexts',
      { headers: { Authorization: `Bearer ${token}` } },
    ),
  ])

  const contexts = unwrapData(contextsPayload).map(mapContext)

  return {
    token,
    user: mapUser(me),
    contexts,
  }
}

export async function login(
  credentials: LoginCredentials,
): Promise<LoginResult> {
  if (useMocks) return mockApi.login(credentials)

  const raw = await http.post<ApiLoginResponse>('/auth/login', {
    email: credentials.email,
    password: credentials.password,
    device_name: 'web',
  })

  if ('mfa_required' in raw && raw.mfa_required === true) {
    return raw
  }

  if (!('token' in raw)) {
    throw new Error('Unexpected login response')
  }

  return fetchSession(raw.token)
}

export async function verifyMfa(
  mfaToken: string,
  code: string,
): Promise<AuthSession> {
  if (useMocks) return mockApi.verifyMfa(mfaToken, code)

  // MFA/TOTP (D-10) is not implemented on the API yet.
  const raw = await http.post<{ token: string }>('/auth/mfa/verify', {
    mfa_token: mfaToken,
    code,
  })
  return fetchSession(raw.token)
}

export async function logout(): Promise<void> {
  if (useMocks) return mockApi.logout()
  await http.post('/auth/logout')
}
