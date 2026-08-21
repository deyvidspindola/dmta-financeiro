import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import { mockApi } from '@/mocks/store'
import type { Account } from '@/types/models'

export type CreateAccountInput = Omit<Account, 'id' | 'context_id' | 'currency'>

export async function listAccounts(contextId: string): Promise<Account[]> {
  if (useMocks) return mockApi.listAccounts(contextId)
  return unwrapData(
    await http.get<Account[] | { data: Account[] }>(
      `/api/v1/contexts/${contextId}/accounts`,
    ),
  )
}

export async function createAccount(
  contextId: string,
  payload: CreateAccountInput,
): Promise<Account> {
  if (useMocks) return mockApi.createAccount(contextId, payload)
  return unwrapData(
    await http.post<Account | { data: Account }>(
      `/api/v1/contexts/${contextId}/accounts`,
      payload,
    ),
  )
}
