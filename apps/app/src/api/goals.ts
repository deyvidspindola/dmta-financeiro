import { http, unwrapData } from '@/api/http';
import { mapGoal, toCreateGoalBody } from '@/api/mappers';
import type { Goal } from '@/types/models';

export type GoalInput = {
  name: string;
  target_amount: number;
  target_date: string | null;
  notes: string | null;
};

export async function listGoals(contextId: string): Promise<Goal[]> {
  const payload = await http.get<
    Parameters<typeof mapGoal>[0][] | { data: Parameters<typeof mapGoal>[0][] }
  >(`/contexts/${contextId}/goals`);
  return unwrapData(payload).map(mapGoal);
}

export async function createGoal(contextId: string, input: GoalInput): Promise<Goal> {
  const payload = await http.post<
    Parameters<typeof mapGoal>[0] | { data: Parameters<typeof mapGoal>[0] }
  >(`/contexts/${contextId}/goals`, toCreateGoalBody(input));
  return mapGoal(unwrapData(payload));
}

export async function updateGoal(
  contextId: string,
  goalId: string,
  input: GoalInput,
): Promise<Goal> {
  const payload = await http.patch<
    Parameters<typeof mapGoal>[0] | { data: Parameters<typeof mapGoal>[0] }
  >(`/contexts/${contextId}/goals/${goalId}`, toCreateGoalBody(input));
  return mapGoal(unwrapData(payload));
}

export async function deleteGoal(contextId: string, goalId: string): Promise<void> {
  await http.delete(`/contexts/${contextId}/goals/${goalId}`);
}
