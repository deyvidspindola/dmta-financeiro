import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/cn'

type Tone = 'neutral' | 'positive' | 'negative' | 'brand'
const VALUE_TONE: Record<Tone, string> = {
  neutral: 'text-fg',
  positive: 'text-positive',
  negative: 'text-negative',
  brand: 'text-brand-600 dark:text-brand-400',
}

/**
 * Cartão de indicador — rótulo, valor em destaque e, opcionalmente, uma
 * variação (delta) e um ícone. `value` já vem formatado (string ou nó).
 */
export function Stat({
  label,
  value,
  tone = 'neutral',
  delta,
  hint,
  icon: Icon,
  onClick,
}: {
  label: string
  value: ReactNode
  tone?: Tone
  delta?: { value: string; direction: 'up' | 'down' }
  hint?: string
  icon?: LucideIcon
  onClick?: () => void
}) {
  const Wrapper = onClick ? 'button' : 'div'
  return (
    <Wrapper
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={cn(
        'flex flex-col gap-1 rounded-2xl border border-line bg-surface p-4 text-left shadow-card',
        onClick && 'transition hover:border-brand-500/40 hover:shadow-pop',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
          {label}
        </span>
        {Icon ? (
          <Icon size={16} className="text-fg-subtle" aria-hidden />
        ) : null}
      </div>
      <span
        className={cn(
          'font-display text-xl font-bold tabular-nums',
          VALUE_TONE[tone],
        )}
      >
        {value}
      </span>
      {delta ? (
        <span
          className={cn(
            'inline-flex items-center gap-1 text-xs font-medium',
            delta.direction === 'up' ? 'text-positive' : 'text-negative',
          )}
        >
          {delta.direction === 'up' ? (
            <TrendingUp size={13} aria-hidden />
          ) : (
            <TrendingDown size={13} aria-hidden />
          )}
          {delta.value}
        </span>
      ) : hint ? (
        <span className="text-xs text-fg-subtle">{hint}</span>
      ) : null}
    </Wrapper>
  )
}
