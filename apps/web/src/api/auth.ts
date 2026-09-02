import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import { mapContext, mapUser } from '@/api/mappers'
import { mockApi } from '@/mocks/store'
import type {
  AuthSession,
  LoginCredentials,
  LoginResult,
  MfaChallenge,
  User,
} from '@/types/models'

type ApiUser = {
  id: string | number
  name: string
  email: string
  mfa_enabled?: boolean
}

type ApiLoginResponse =
  | {
      mfa_required: false
      token: string
      user: ApiUser
    }
  | {
      mfa_required: true
      mfa_token: string
    }
  // Backward-compatible shape without mfa_required
  | {
      token: string
      user: ApiUser
    }

export type MfaEnrollPayload = {
  secret: string
  otpauth_uri: string
}

async function fetchSession(token: string): Promise<AuthSession> {
  const [me, contextsPayload] = await Promise.all([
    http.get<ApiUser>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    }),
    http.get<
      | Array<Parameters<typeof mapContext>[0]>
      | { data: Array<Parameters<typeof mapContext>[0]> }
    >('/contexts', {
      headers: { Authorization: `Bearer ${token}` },
    }),
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
    const challenge: MfaChallenge = {
      mfa_required: true,
      mfa_token: raw.mfa_token,
    }
    return challenge
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

  const raw = await http.post<{ token: string; user: ApiUser }>(
    '/auth/mfa/verify',
    { code, device_name: 'web' },
    { headers: { Authorization: `Bearer ${mfaToken}` } },
  )
  return fetchSession(raw.token)
}

export async function logout(): Promise<void> {
  if (useMocks) return mockApi.logout()
  await http.post('/auth/logout')
}

export async function getMe(): Promise<User> {
  if (useMocks) return mockApi.getMe()
  return mapUser(await http.get<ApiUser>('/auth/me'))
}

export async function enrollMfa(): Promise<MfaEnrollPayload> {
  if (useMocks) return mockApi.enrollMfa()
  return http.post<MfaEnrollPayload>('/auth/mfa/enroll')
}

export async function confirmMfa(code: string): Promise<{ mfa_enabled: true }> {
  if (useMocks) return mockApi.confirmMfa(code)
  return http.post<{ mfa_enabled: true }>('/auth/mfa/confirm', { code })
}

export async function disableMfa(): Promise<void> {
  if (useMocks) return mockApi.disableMfa()
  await http.delete('/auth/mfa')
}

export async function resetAccountData(password: string): Promise<void> {
  if (useMocks) return mockApi.resetAccountData(password)
  await http.post('/account/reset', { password })
}
