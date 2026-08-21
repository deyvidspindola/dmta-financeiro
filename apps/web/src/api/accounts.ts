import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import { mapAccount, toCreateAccountBody } from '@/api/mappers'
import { mockApi } from '@/mocks/store'
import type { Account } from '@/types/models'

export type CreateAccountInput = Omit<Account, 'id' | 'context_id' | 'currency'>

export async function listAccounts(contextId: string): Promise<Account[]> {
  if (useMocks) return mockApi.listAccounts(contextId)
  const payload = await http.get<
    | Array<Parameters<typeof mapAccount>[1]>
    | { data: Array<Parameters<typeof mapAccount>[1]> }
  >(`/contexts/${contextId}/accounts`)
  return unwrapData(payload).map((row) => mapAccount(contextId, row))
}

export async function createAccount(
  contextId: string,
  payload: CreateAccountInput,
): Promise<Account> {
  if (useMocks) return mockApi.createAccount(contextId, payload)
  const created = unwrapData(
    await http.post<
      | Parameters<typeof mapAccount>[1]
      | { data: Parameters<typeof mapAccount>[1] }
    >(`/contexts/${contextId}/accounts`, toCreateAccountBody(payload)),
  )
  return mapAccount(contextId, created)
}

export async function deleteAccount(
  contextId: string,
  accountId: string,
): Promise<void> {
  if (useMocks) return mockApi.deleteAccount(contextId, accountId)
  await http.delete(`/contexts/${contextId}/accounts/${accountId}`)
}
