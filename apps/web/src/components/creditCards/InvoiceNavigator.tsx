import { ChevronLeft, ChevronRight } from 'lucide-react'
import { IconButton } from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { formatMonthLabel } from '@/lib/dates'
import { cn } from '@/lib/cn'

const t = strings.creditCards

/** Navegador ‹ Fatura · mês › no estilo do MonthNavigator. */
export function InvoiceNavigator({
  referenceMonth,
  onPrev,
  onNext,
  canPrev,
  canNext,
  compact = false,
}: {
  referenceMonth: string
  onPrev: () => void
  onNext: () => void
  canPrev: boolean
  canNext: boolean
  compact?: boolean
}) {
  const monthLabel = formatMonthLabel(referenceMonth)

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5',
        compact ? 'gap-0' : 'rounded-xl bg-surface px-1 py-0.5',
      )}
    >
      <IconButton
        label={t.prevInvoice}
        icon={ChevronLeft}
        variant="ghost"
        size={compact ? 'sm' : 'md'}
        onClick={onPrev}
        disabled={!canPrev}
      />
      <span
        className={cn(
          'inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium text-fg',
          compact && 'px-2',
        )}
      >
        {t.invoiceNavLabel} {monthLabel}
      </span>
      <IconButton
        label={t.nextInvoice}
        icon={ChevronRight}
        variant="ghost"
        size={compact ? 'sm' : 'md'}
        onClick={onNext}
        disabled={!canNext}
      />
    </div>
  )
}
