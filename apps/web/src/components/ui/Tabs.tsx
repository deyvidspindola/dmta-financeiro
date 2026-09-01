import { cn } from '@/lib/cn'

export type TabItem<T extends string = string> = {
  value: T
  label: string
  count?: number
}

/**
 * Abas / controle segmentado — controlado. Use para trocar a visão dentro
 * de uma tela (não para navegação de rota). Mantém foco por teclado
 * (setas) via `role="tablist"`.
 */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  size = 'md',
  className,
}: {
  items: TabItem<T>[]
  value: T
  onChange: (value: T) => void
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex gap-1 rounded-xl border border-line bg-surface-2 p-1',
        className,
      )}
    >
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg font-medium transition',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
              active
                ? 'bg-surface text-fg shadow-card'
                : 'text-fg-muted hover:text-fg',
            )}
          >
            {item.label}
            {typeof item.count === 'number' ? (
              <span
                className={cn(
                  'rounded-full px-1.5 text-[11px] tabular-nums',
                  active ? 'bg-brand-500/15 text-brand-700 dark:text-brand-300' : 'bg-surface-2 text-fg-subtle',
                )}
              >
                {item.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
