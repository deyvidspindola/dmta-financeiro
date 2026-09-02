import { Pencil, Trash2 } from 'lucide-react'
import {
  Card,
  CategoryChip,
  IconButton,
  Money,
  ProgressBar,
} from '@/components/ui'
import type { BudgetProgress } from '@/api/budgets'
import { strings } from '@/i18n/pt-BR'
import { formatMoney } from '@/lib/format'

const t = strings.budgets

type BudgetCardProps = {
  row: BudgetProgress
  onEdit: () => void
  onDelete: () => void
  deletePending?: boolean
}

export function BudgetCard({
  row,
  onEdit,
  onDelete,
  deletePending,
}: BudgetCardProps) {
  const pct = Math.min(100, row.percent)
  const tone = row.over ? 'negative' : pct > 85 ? 'warning' : 'brand'

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <CategoryChip
          name={row.category_name}
          colorIndex={row.category_id}
        />
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
      </div>

      <ProgressBar
        value={pct}
        tone={tone}
        label={`${row.category_name}: ${pct}%`}
      />

      <div className="flex flex-wrap items-end justify-between gap-2 text-sm">
        <div>
          <p className="text-fg">
            <Money amount={row.spent} size="sm" />
            <span className="text-fg-muted">
              {' '}
              {t.ofLimit}{' '}
              <Money amount={row.limit} size="sm" className="inline" />
            </span>
          </p>
          {row.spent_effective !== row.spent ? (
            <p className="mt-0.5 text-xs text-fg-subtle">
              {t.effectiveVsProjected(
                formatMoney(row.spent_effective),
                formatMoney(row.spent),
              )}
            </p>
          ) : null}
        </div>
        <p className={row.over ? 'font-medium text-negative' : 'text-fg-muted'}>
          {row.over
            ? `${t.over} ${formatMoney(row.spent - row.limit)}`
            : `${t.remaining} ${formatMoney(row.remaining)}`}
        </p>
      </div>
    </Card>
  )
}
