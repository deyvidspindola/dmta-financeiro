import { cn } from '@/lib/cn'

type Tone = 'brand' | 'positive' | 'negative' | 'warning'
const BAR_TONE: Record<Tone, string> = {
  brand: 'bg-brand-600',
  positive: 'bg-positive',
  negative: 'bg-negative',
  warning: 'bg-amber-500',
}
const RING_TONE: Record<Tone, string> = {
  brand: 'stroke-brand-600',
  positive: 'stroke-positive',
  negative: 'stroke-negative',
  warning: 'stroke-amber-500',
}

function clampPct(value: number): number {
  return Math.max(0, Math.min(100, value))
}

/** Barra de progresso — orçamento, meta. `value` em 0–100. */
export function ProgressBar({
  value,
  tone = 'brand',
  className,
  label,
}: {
  value: number
  tone?: Tone
  className?: string
  label?: string
}) {
  const pct = clampPct(value)
  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-2', className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cn('h-full rounded-full transition-[width]', BAR_TONE[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/** Anel de progresso — metas. `value` em 0–100. */
export function ProgressRing({
  value,
  size = 64,
  stroke = 6,
  tone = 'brand',
  children,
}: {
  value: number
  size?: number
  stroke?: number
  tone?: Tone
  children?: React.ReactNode
}) {
  const pct = clampPct(value)
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-surface-2"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct / 100)}
          className={cn('transition-[stroke-dashoffset]', RING_TONE[tone])}
        />
      </svg>
      {children ? (
        <span className="absolute text-xs font-semibold tabular-nums text-fg">
          {children}
        </span>
      ) : null}
    </div>
  )
}
