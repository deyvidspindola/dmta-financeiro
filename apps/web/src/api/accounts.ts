import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import {
  mapAccount,
  toCreateAccountBody,
  toUpdateAccountBody,
} from '@/api/mappers'
import { mockApi } from '@/mocks/store'
import type { Account, AccountType } from '@/types/models'

export type CreateAccountInput = Omit<Account, 'id' | 'context_id' | 'currency'>

export type UpdateAccountInput = {
  name: string
  bank_name: string | null
  type: AccountType
}

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

export async function updateAccount(
  contextId: string,
  accountId: string,
  payload: UpdateAccountInput,
): Promise<Account> {
  if (useMocks) return mockApi.updateAccount(contextId, accountId, payload)
  const updated = unwrapData(
    await http.patch<
      | Parameters<typeof mapAccount>[1]
      | { data: Parameters<typeof mapAccount>[1] }
    >(
      `/contexts/${contextId}/accounts/${accountId}`,
      toUpdateAccountBody(payload),
    ),
  )
  return mapAccount(contextId, updated)
}

export async function deleteAccount(
  contextId: string,
  accountId: string,
): Promise<void> {
  if (useMocks) return mockApi.deleteAccount(contextId, accountId)
  await http.delete(`/contexts/${contextId}/accounts/${accountId}`)
}
