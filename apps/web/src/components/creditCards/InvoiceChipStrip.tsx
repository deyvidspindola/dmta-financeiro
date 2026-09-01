import { Check } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { strings } from '@/i18n/pt-BR'
import { formatMonthAbbrev, type InvoiceTimelineEntry } from '@/lib/creditCardInvoices'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/cn'

const t = strings.creditCards

type Props = {
  timeline: InvoiceTimelineEntry[]
  selectedMonth: string
  onSelect: (referenceMonth: string) => void
}

/** Faixa horizontal rolável de chips por mês de referência da fatura. */
export function InvoiceChipStrip({ timeline, selectedMonth, onSelect }: Props) {
  const stripRef = useRef<HTMLDivElement>(null)
  const chipRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  useEffect(() => {
    const chip = chipRefs.current.get(selectedMonth)
    chip?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [selectedMonth, timeline.length])

  const anchorIdx = timeline.findIndex((entry) => {
    if (entry.invoice?.status === 'open') return true
    return false
  })
  const fallbackAnchor =
    timeline.findLastIndex((entry) => entry.invoice !== null) ?? -1
  const currentIdx = anchorIdx >= 0 ? anchorIdx : fallbackAnchor

  return (
    <nav
      ref={stripRef}
      aria-label={t.invoiceChipStrip}
      className="flex gap-2 overflow-x-auto px-1 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory"
    >
      {timeline.map((entry, index) => {
        const isSelected = entry.reference_month === selectedMonth
        const isFuture = index > currentIdx
        const isPaid = entry.invoice?.status === 'paid'
        const isSynthetic = entry.isSynthetic
        const amountLabel = isSynthetic
          ? t.chipNoAmount
          : formatMoney(entry.invoice?.amount ?? 0)

        return (
          <button
            key={entry.reference_month}
            type="button"
            ref={(node) => {
              if (node) chipRefs.current.set(entry.reference_month, node)
              else chipRefs.current.delete(entry.reference_month)
            }}
            aria-current={isSelected ? 'true' : undefined}
            aria-label={`${formatMonthAbbrev(entry.reference_month)} ${amountLabel}`}
            onClick={() => onSelect(entry.reference_month)}
            className={cn(
              'flex min-w-[4.5rem] shrink-0 snap-center flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-center transition',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
              isSelected &&
                'bg-brand-500/12 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500/30',
              !isSelected && !isFuture && !isPaid && 'bg-surface-2 text-fg hover:bg-surface',
              !isSelected && isFuture && 'border border-dashed border-line bg-transparent text-fg-muted',
              !isSelected && isPaid && 'bg-surface-2/60 text-fg-subtle',
            )}
          >
            <span className="flex items-center gap-1 text-xs font-semibold">
              {formatMonthAbbrev(entry.reference_month)}
              {isPaid ? <Check size={12} aria-hidden className="text-positive" /> : null}
            </span>
            <span
              className={cn(
                'text-[10px] tabular-nums',
                isSynthetic ? 'text-fg-subtle' : 'text-fg-muted',
              )}
            >
              {isSynthetic ? t.forecast : amountLabel}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
