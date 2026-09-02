import { Pencil, Trash2 } from 'lucide-react'
import {
  Badge,
  Card,
  IconButton,
  Money,
  ProgressRing,
} from '@/components/ui'
import { projectGoalCompletion } from '@/components/goals/goalProjection'
import { strings } from '@/i18n/pt-BR'
import { formatDate } from '@/lib/format'
import type { Goal } from '@/types/models'

const t = strings.goals

type GoalCardProps = {
  goal: Goal
  onEdit: () => void
  onDelete: () => void
  canMutate?: boolean
  deletePending?: boolean
}

export function GoalCard({
  goal,
  onEdit,
  onDelete,
  canMutate,
  deletePending,
}: GoalCardProps) {
  const pct = Math.min(100, Math.max(0, goal.percent_complete))
  const tone =
    goal.status === 'completed'
      ? 'positive'
      : pct >= 75
        ? 'brand'
        : 'brand'
  const projection = projectGoalCompletion(goal)

  return (
    <Card className="flex gap-4 sm:items-center">
      <ProgressRing value={pct} tone={tone} size={72} stroke={7}>
        {Math.round(pct)}%
      </ProgressRing>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-display text-base font-semibold text-fg">
              {goal.name}
            </h3>
            <p className="text-sm text-fg-muted">
              <Money amount={goal.current_amount} size="sm" className="inline" />
              <span> {t.ofTarget} </span>
              <Money amount={goal.target_amount} size="sm" className="inline" />
            </p>
          </div>
          {canMutate ? (
            <div className="flex shrink-0 gap-0.5">
              <IconButton
                label={strings.common.edit}
                icon={Pencil}
                variant="ghost"
                size="sm"
                onClick={onEdit}
              />
              <IconButton
                label={strings.common.delete}
                icon={Trash2}
                variant="danger"
                size="sm"
                onClick={onDelete}
                disabled={deletePending}
              />
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
          {goal.target_date ? (
            <span>
              {t.targetDate}: {formatDate(goal.target_date)}
            </span>
          ) : null}
          <Badge
            tone={goal.status === 'completed' ? 'success' : 'brand'}
            dot
          >
            {t.statuses[goal.status]}
          </Badge>
        </div>

        {projection ? (
          <p className="text-xs text-fg-subtle">
            {t.projectedCompletion(projection)}
          </p>
        ) : null}
      </div>
    </Card>
  )
}
