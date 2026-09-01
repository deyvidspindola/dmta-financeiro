import { ChevronLeft, ChevronRight } from 'lucide-react'
import { IconButton } from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { cn } from '@/lib/cn'
import { currentMonthKey, formatMonthLabel } from '@/lib/dates'
import { useMonthStore } from '@/store/monthStore'

type Props = {
  compact?: boolean
}

/** ‹ Setembro 2026 › — o navegador de mês global (topo). */
export function MonthNavigator({ compact = false }: Props) {
  const { month, shift, reset } = useMonthStore()
  const isCurrent = month === currentMonthKey()
  const label = formatMonthLabel(month)

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5',
        compact ? 'gap-0' : 'rounded-xl bg-surface px-1 py-0.5',
      )}
    >
      <IconButton
        label={strings.monthNav.prevMonth}
        icon={ChevronLeft}
        variant="ghost"
        size={compact ? 'sm' : 'md'}
        onClick={() => shift(-1)}
      />
      <button
        type="button"
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg font-medium text-fg transition',
          'hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
          compact ? 'px-2 py-1 text-sm capitalize' : 'px-3 py-1.5 text-sm capitalize',
        )}
        onClick={reset}
        title={isCurrent ? undefined : strings.monthNav.backToCurrent}
      >
        {compact ? label.replace(' de ', ' ') : label}
        {!isCurrent ? (
          <span
            className="size-1.5 shrink-0 rounded-full bg-brand-500"
            aria-hidden
          />
        ) : null}
      </button>
      <IconButton
        label={strings.monthNav.nextMonth}
        icon={ChevronRight}
        variant="ghost"
        size={compact ? 'sm' : 'md'}
        onClick={() => shift(1)}
      />
    </div>
  )
}
