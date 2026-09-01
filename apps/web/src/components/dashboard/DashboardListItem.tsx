import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

/**
 * Linha clicável para listas do dashboard — conta, lançamento, etc.
 */
export function DashboardListItem({
  to,
  children,
  className,
  ariaLabel,
}: {
  to: string
  children: ReactNode
  className?: string
  ariaLabel?: string
}) {
  return (
    <Link
      to={to}
      aria-label={ariaLabel}
      className={cn(
        'flex items-center gap-3 rounded-xl px-2 py-3 transition',
        'hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
        className,
      )}
    >
      <div className="min-w-0 flex-1">{children}</div>
      <ChevronRight
        size={16}
        className="shrink-0 text-fg-subtle"
        aria-hidden
      />
    </Link>
  )
}
