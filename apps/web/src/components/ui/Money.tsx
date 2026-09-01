import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/cn'

/** Rótulo visual do valor — não confundir com `MoneyDirection` (income/expense). */
export type CreditDebit = 'credit' | 'debit'

type Size = 'sm' | 'md' | 'lg' | 'xl'
const SIZE: Record<Size, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-lg',
  xl: 'text-2xl',
}

/**
 * Valor monetário com sinal e cor: `+` verde para entrada (`credit`), `−`
 * vermelho para saída (`debit`). Quem chama decide a direção. Numerais
 * tabulares para alinhar em listas.
 */
export function MoneyValue({
  amount,
  direction,
  size = 'md',
  className,
}: {
  amount: number
  direction: CreditDebit
  size?: Size
  className?: string
}) {
  const credit = direction === 'credit'
  return (
    <span
      className={cn(
        'font-semibold tabular-nums',
        credit ? 'text-positive' : 'text-negative',
        SIZE[size],
        className,
      )}
    >
      {credit ? '+' : '−'} {formatMoney(Math.abs(amount))}
    </span>
  )
}

/** Valor neutro (sem sinal/cor de direção) — saldos, totais. */
export function Money({
  amount,
  size = 'md',
  className,
}: {
  amount: number
  size?: Size
  className?: string
}) {
  return (
    <span className={cn('font-semibold tabular-nums text-fg', SIZE[size], className)}>
      {formatMoney(amount)}
    </span>
  )
}
