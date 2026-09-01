import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Tabela de dados com cabeçalho fixo e rolagem horizontal própria. Passe
 * as `<tr>`/`<td>` como `children` (use `<Td>` para herdar o padding).
 * `align` alinha uma coluna à direita (valores) — combine com `<Td right>`.
 */
export function DataTable({
  headers,
  children,
  className,
}: {
  headers: (string | { label: string; right?: boolean })[]
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'overflow-x-auto rounded-2xl border border-line bg-surface',
        className,
      )}
    >
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-surface-2/60">
            {headers.map((h) => {
              const label = typeof h === 'string' ? h : h.label
              const right = typeof h === 'object' && h.right
              return (
                <th
                  key={label}
                  className={cn(
                    'px-4 py-3 text-xs font-semibold uppercase tracking-wide text-fg-subtle',
                    right ? 'text-right' : 'text-left',
                  )}
                >
                  {label}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  )
}

export function Tr({
  children,
  onClick,
  className,
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'transition',
        onClick && 'cursor-pointer hover:bg-surface-2/70',
        className,
      )}
    >
      {children}
    </tr>
  )
}

export function Td({
  children,
  right,
  className,
  colSpan,
}: {
  children: ReactNode
  right?: boolean
  className?: string
  colSpan?: number
}) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        'px-4 py-3 text-fg',
        right && 'text-right tabular-nums',
        className,
      )}
    >
      {children}
    </td>
  )
}
