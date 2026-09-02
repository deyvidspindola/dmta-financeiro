import { ChevronRight, Pencil, Trash2 } from 'lucide-react'
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
import { cn } from '@/lib/cn'

const t = strings.budgets

type BudgetCardProps = {
  row: BudgetProgress
  onOpen: () => void
  onEdit: () => void
  onDelete: () => void
  deletePending?: boolean
}

export function BudgetCard({
  row,
  onOpen,
  onEdit,
  onDelete,
  deletePending,
}: BudgetCardProps) {
  const pct = Math.min(100, row.percent)
  const tone = row.over ? 'negative' : pct > 85 ? 'warning' : 'brand'

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen()
        }
      }}
      className={cn(
        'cursor-pointer rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
      )}
    >
      <Card
        as="div"
        className={cn(
          'pointer-events-none space-y-3 transition',
          'hover:bg-surface-2/40',
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <CategoryChip
            name={row.category_name}
            colorIndex={row.category_id}
          />
          <div
            className="pointer-events-auto flex shrink-0 items-center gap-0.5"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
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
            <ChevronRight
              size={16}
              className="ml-0.5 shrink-0 text-fg-subtle"
              aria-hidden
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
    </div>
  )
}
