import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Lista estilo extrato bancário — sem header de colunas, densidade alta,
 * agrupável por dia. Use `StatementGroup` + `StatementRow`.
 */
export function StatementList({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('space-y-3', className)}>{children}</div>
}

/** Cabeçalho discreto de dia (ou outro agrupador) + bloco de linhas. */
export function StatementGroup({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={className}>
      <h2 className="mb-0.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
        {label}
      </h2>
      <ul className="divide-y divide-line border-y border-line bg-surface sm:rounded-xl sm:border">
        {children}
      </ul>
    </section>
  )
}

type StatementRowProps = {
  title: ReactNode
  /** Categoria, conta, badges — linha secundária. */
  meta?: ReactNode
  /** Valor alinhado à direita (tipicamente `MoneyValue`). */
  amount: ReactNode
  onClick?: () => void
  ariaLabel?: string
  className?: string
}

/**
 * Linha de extrato: título + meta à esquerda, valor à direita.
 * Clicável via `onClick` (abre detalhe em modal na maioria das telas).
 */
export function StatementRow({
  title,
  meta,
  amount,
  onClick,
  ariaLabel,
  className,
}: StatementRowProps) {
  const interactive = Boolean(onClick)
  const body = (
    <>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg">{title}</p>
        {meta ? (
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-fg-muted">
            {meta}
          </div>
        ) : null}
      </div>
      <div className="shrink-0 self-center">{amount}</div>
    </>
  )

  return (
    <li>
      {interactive ? (
        <button
          type="button"
          onClick={onClick}
          aria-label={ariaLabel}
          className={cn(
            'flex w-full items-start gap-3 px-3 py-2.5 text-left transition',
            'hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-600',
            className,
          )}
        >
          {body}
        </button>
      ) : (
        <div
          className={cn('flex items-start gap-3 px-3 py-2.5', className)}
          aria-label={ariaLabel}
        >
          {body}
        </div>
      )}
    </li>
  )
}
