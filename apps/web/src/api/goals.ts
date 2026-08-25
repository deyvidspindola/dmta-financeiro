import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import { mapGoal, toCreateGoalBody } from '@/api/mappers'
import { mockApi } from '@/mocks/store'
import type { Goal } from '@/types/models'

export type CreateGoalInput = {
  name: string
  target_amount: number
  target_date: string | null
  notes: string | null
}

export type UpdateGoalInput = CreateGoalInput

export async function listGoals(contextId: string): Promise<Goal[]> {
  if (useMocks) return mockApi.listGoals(contextId)
  const payload = await http.get<
    | Array<Parameters<typeof mapGoal>[0]>
    | { data: Array<Parameters<typeof mapGoal>[0]> }
  >(`/contexts/${contextId}/goals`)
  return unwrapData(payload).map(mapGoal)
}

export async function createGoal(
  contextId: string,
  payload: CreateGoalInput,
): Promise<Goal> {
  if (useMocks) return mockApi.createGoal(contextId, payload)
  const created = unwrapData(
    await http.post<
      | Parameters<typeof mapGoal>[0]
      | { data: Parameters<typeof mapGoal>[0] }
    >(`/contexts/${contextId}/goals`, toCreateGoalBody(payload)),
  )
  return mapGoal(created)
}

export async function updateGoal(
  contextId: string,
  goalId: string,
  payload: UpdateGoalInput,
): Promise<Goal> {
  if (useMocks) return mockApi.updateGoal(contextId, goalId, payload)
  const updated = unwrapData(
    await http.patch<
      | Parameters<typeof mapGoal>[0]
      | { data: Parameters<typeof mapGoal>[0] }
    >(
      `/contexts/${contextId}/goals/${goalId}`,
      toCreateGoalBody(payload),
    ),
  )
  return mapGoal(updated)
}

export async function deleteGoal(
  contextId: string,
  goalId: string,
): Promise<void> {
  if (useMocks) return mockApi.deleteGoal(contextId, goalId)
  await http.delete(`/contexts/${contextId}/goals/${goalId}`)
}
