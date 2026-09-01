import { Badge, Money, ProgressBar } from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { CreditCard } from '@/types/models'

const t = strings.creditCards

type BrandStyle = { gradient: string; badgeTone: 'brand' | 'accent' | 'info' | 'warning' }

const BRAND_STYLES: Record<string, BrandStyle> = {
  visa: {
    gradient: 'from-brand-900 via-brand-800 to-brand-600',
    badgeTone: 'brand',
  },
  mastercard: {
    gradient: 'from-accent-900 via-accent-800 to-accent-600',
    badgeTone: 'accent',
  },
  elo: {
    gradient: 'from-amber-900 via-amber-800 to-amber-600',
    badgeTone: 'warning',
  },
  amex: {
    gradient: 'from-sky-900 via-sky-800 to-sky-600',
    badgeTone: 'info',
  },
}

const DEFAULT_STYLE: BrandStyle = {
  gradient: 'from-brand-900 via-accent-900 to-brand-700',
  badgeTone: 'brand',
}

function resolveBrandStyle(brand: string | null): BrandStyle {
  if (!brand) return DEFAULT_STYLE
  return BRAND_STYLES[brand.trim().toLowerCase()] ?? DEFAULT_STYLE
}

/** Cartão visual estilo cartão de crédito para a grade da listagem. */
export function VisualCreditCard({
  card,
  className,
}: {
  card: CreditCard
  className?: string
}) {
  const style = resolveBrandStyle(card.brand)
  const used = card.unpaid_invoices_total
  const pct =
    card.limit > 0 ? Math.min(100, Math.round((used / card.limit) * 100)) : 0
  const progressTone = pct >= 100 ? 'negative' : pct >= 80 ? 'warning' : 'brand'

  return (
    <article
      className={cn(
        'relative flex min-h-[168px] flex-col justify-between overflow-hidden rounded-2xl p-5 shadow-card',
        'bg-gradient-to-br text-white transition hover:shadow-pop focus-within:ring-2 focus-within:ring-brand-500/50',
        style.gradient,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="truncate font-display text-base font-semibold">{card.name}</h2>
        {card.brand ? (
          <Badge tone={style.badgeTone} className="shrink-0 bg-white/15 text-white">
            {card.brand}
          </Badge>
        ) : null}
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-white/70">{t.available}</p>
            <p className="font-display text-xl font-bold tabular-nums">
              {card.available_limit === null
                ? '—'
                : formatMoney(card.available_limit)}
            </p>
          </div>
          <p className="text-right text-xs text-white/80">
            {t.used} {pct}%
          </p>
        </div>
        <ProgressBar
          value={pct}
          tone={progressTone}
          className="bg-white/20 [&>div]:bg-white"
          label={`${t.used} ${pct}%`}
        />
      </div>

      {card.current_invoice_total > 0 ? (
        <p className="mt-3 text-sm text-white/90">
          {t.currentInvoice}:{' '}
          <Money amount={card.current_invoice_total} size="sm" className="text-white" />
        </p>
      ) : null}
    </article>
  )
}
