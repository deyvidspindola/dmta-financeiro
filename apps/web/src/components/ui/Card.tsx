import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Cartão de superfície — base de quase toda seção da UI. */
export function Card({
  children,
  className,
  as: As = 'section',
  padded = true,
}: {
  children: ReactNode
  className?: string
  as?: 'section' | 'div' | 'article'
  padded?: boolean
}) {
  return (
    <As
      className={cn(
        'rounded-2xl border border-line bg-surface shadow-card',
        padded && 'p-5',
        className,
      )}
    >
      {children}
    </As>
  )
}

export function CardHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h3 className="font-display text-base font-semibold text-fg">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-sm text-fg-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </div>
  )
}

/** Compat com o `Panel` legado: seção com título opcional. */
export function Panel({
  title,
  children,
  className,
}: {
  title?: string
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={className}>
      {title ? (
        <h2 className="mb-3 font-display text-base font-semibold text-fg">
          {title}
        </h2>
      ) : null}
      {children}
    </Card>
  )
}

/** Cabeçalho de página — título, descrição e ações à direita. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight text-fg sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-fg-muted">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap gap-2">{actions}</div>
      ) : null}
    </header>
  )
}
