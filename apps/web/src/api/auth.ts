import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import { mockApi } from '@/mocks/store'
import type {
  AuthSession,
  LoginCredentials,
  LoginResult,
} from '@/types/models'

export async function login(
  credentials: LoginCredentials,
): Promise<LoginResult> {
  if (useMocks) return mockApi.login(credentials)
  return unwrapData(
    await http.post<LoginResult | { data: LoginResult }>(
      '/api/v1/auth/login',
      credentials,
    ),
  )
}

export async function verifyMfa(
  mfaToken: string,
  code: string,
): Promise<AuthSession> {
  if (useMocks) return mockApi.verifyMfa(mfaToken, code)
  return unwrapData(
    await http.post<AuthSession | { data: AuthSession }>(
      '/api/v1/auth/mfa/verify',
      { mfa_token: mfaToken, code },
    ),
  )
}

export async function logout(): Promise<void> {
  if (useMocks) return mockApi.logout()
  await http.post('/api/v1/auth/logout')
}
