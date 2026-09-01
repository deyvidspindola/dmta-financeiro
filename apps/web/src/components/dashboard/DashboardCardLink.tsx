import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui'
import { cn } from '@/lib/cn'

/** Card inteiro clicável — orçamentos, metas. */
export function DashboardCardLink({
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
        'block rounded-2xl transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
        'hover:[&_.dash-card]:border-brand-500/40 hover:[&_.dash-card]:shadow-pop',
        className,
      )}
    >
      <Card className="dash-card">{children}</Card>
    </Link>
  )
}
