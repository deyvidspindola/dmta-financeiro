import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type BadgeTone =
  | 'neutral'
  | 'brand'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'

const TONE: Record<BadgeTone, string> = {
  neutral: 'bg-surface-2 text-fg-muted',
  brand: 'bg-brand-500/12 text-brand-700 dark:text-brand-300',
  accent: 'bg-accent-500/12 text-accent-700 dark:text-accent-300',
  success: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
  warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  danger: 'bg-red-500/12 text-red-700 dark:text-red-300',
  info: 'bg-sky-500/12 text-sky-700 dark:text-sky-300',
}

export function Badge({
  children,
  tone = 'neutral',
  icon: Icon,
  dot = false,
  className,
}: {
  children: ReactNode
  tone?: BadgeTone
  icon?: LucideIcon
  dot?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        TONE[tone],
        className,
      )}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" /> : null}
      {Icon ? <Icon size={12} strokeWidth={2.5} aria-hidden /> : null}
      {children}
    </span>
  )
}

/**
 * Chip de categoria — cor vinda da paleta `cat-1..12` (o índice costuma
 * ser `category.id % 12`). Fundo tingido + ponto/ícone na cor cheia.
 */
export function CategoryChip({
  name,
  colorIndex,
  icon: Icon,
  className,
}: {
  name: string
  colorIndex: number
  icon?: LucideIcon
  className?: string
}) {
  const n = (((colorIndex - 1) % 12) + 12) % 12 + 1
  const color = `var(--color-cat-${n})`
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        className,
      )}
      style={{
        color,
        backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)`,
      }}
    >
      {Icon ? (
        <Icon size={12} strokeWidth={2.5} aria-hidden />
      ) : (
        <span
          className="size-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {name}
    </span>
  )
}
