import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import { mapAccount, mapBill, mapTransaction } from '@/api/mappers'
import { mockApi } from '@/mocks/store'
import type { Account, Bill, StatementEntry } from '@/types/models'

export async function listConsolidatedAccounts(): Promise<Account[]> {
  if (useMocks) return mockApi.listConsolidatedAccounts()
  const payload = await http.get<
    | Array<Parameters<typeof mapAccount>[1]>
    | { data: Array<Parameters<typeof mapAccount>[1]> }
  >('/consolidated/accounts')
  return unwrapData(payload).map((row) =>
    mapAccount(row.context ? String(row.context.id) : '', row),
  )
}

export async function listConsolidatedTransactions(): Promise<StatementEntry[]> {
  if (useMocks) return mockApi.listConsolidatedTransactions()
  const payload = await http.get<
    | Array<Parameters<typeof mapTransaction>[1]>
    | { data: Array<Parameters<typeof mapTransaction>[1]> }
  >('/consolidated/transactions')
  return unwrapData(payload).map((row) =>
    mapTransaction(row.context ? String(row.context.id) : '', row),
  )
}

export async function listConsolidatedBills(): Promise<Bill[]> {
  if (useMocks) return mockApi.listConsolidatedBills()
  const payload = await http.get<
    | Array<Parameters<typeof mapBill>[1]>
    | { data: Array<Parameters<typeof mapBill>[1]> }
  >('/consolidated/bills')
  return unwrapData(payload).map((row) =>
    mapBill(row.context ? String(row.context.id) : '', row),
  )
}
