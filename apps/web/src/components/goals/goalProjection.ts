import type { Goal } from '@/types/models'
import { formatMonthLabel } from '@/lib/dates'

/** Estimativa simples quando há data alvo e progresso parcial. */
export function projectGoalCompletion(goal: Goal): string | null {
  if (goal.status === 'completed' || goal.current_amount <= 0) return null
  if (!goal.target_date) return null

  const remaining = goal.target_amount - goal.current_amount
  if (remaining <= 0) return null

  const target = new Date(`${goal.target_date}T12:00:00`)
  const now = new Date()
  const monthsLeft = Math.max(
    1,
    (target.getFullYear() - now.getFullYear()) * 12 +
      (target.getMonth() - now.getMonth()),
  )

  const monthlyPace = goal.current_amount / Math.max(1, 12 - monthsLeft + 1)
  if (monthlyPace <= 0) return null

  const monthsToComplete = Math.ceil(remaining / monthlyPace)
  const completion = new Date(now.getFullYear(), now.getMonth() + monthsToComplete, 1)
  const key = `${completion.getFullYear()}-${String(completion.getMonth() + 1).padStart(2, '0')}`

  return formatMonthLabel(key)
}
