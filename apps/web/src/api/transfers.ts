import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import { mapTransaction, toCreateTransferBody } from '@/api/mappers'
import { mockApi } from '@/mocks/store'
import type { StatementEntry } from '@/types/models'

export type CreateTransferInput = {
  from_account_id: string
  to_account_id: string
  amount: number
  description: string
  occurred_at: string
}

export type TransferResult = {
  from: StatementEntry
  to: StatementEntry
}

export async function createTransfer(
  contextId: string,
  payload: CreateTransferInput,
): Promise<TransferResult> {
  if (useMocks) return mockApi.createTransfer(contextId, payload)

  const raw = unwrapData(
    await http.post<
      | {
          from: Parameters<typeof mapTransaction>[1]
          to: Parameters<typeof mapTransaction>[1]
        }
      | {
          data: {
            from: Parameters<typeof mapTransaction>[1]
            to: Parameters<typeof mapTransaction>[1]
          }
        }
    >(`/contexts/${contextId}/transfers`, toCreateTransferBody(payload)),
  )

  return {
    from: mapTransaction(contextId, raw.from),
    to: mapTransaction(contextId, raw.to),
  }
}
