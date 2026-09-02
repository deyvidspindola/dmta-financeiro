import { Text as RNText } from 'react-native';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';

/** Rótulo visual do valor — não confundir com `MoneyDirection` (income/expense). */
export type CreditDebit = 'credit' | 'debit';

type Size = 'sm' | 'md' | 'lg' | 'xl';
const SIZE: Record<Size, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-lg',
  xl: 'text-2xl',
};

/** Valor com sinal e cor: + verde (credit), − vermelho (debit). */
export function MoneyValue({
  amount,
  direction,
  size = 'md',
  className,
}: {
  amount: number;
  direction: CreditDebit;
  size?: Size;
  className?: string;
}) {
  const credit = direction === 'credit';
  return (
    <RNText
      className={cn(
        'font-semibold tabular-nums',
        credit ? 'text-positive' : 'text-negative',
        SIZE[size],
        className,
      )}
    >
      {credit ? '+' : '−'} {formatMoney(Math.abs(amount))}
    </RNText>
  );
}

/** Valor neutro (sem sinal/cor de direção) — saldos, totais. */
export function Money({
  amount,
  size = 'md',
  className,
}: {
  amount: number;
  size?: Size;
  className?: string;
}) {
  const signed = amount < 0;
  return (
    <RNText
      className={cn(
        'font-semibold tabular-nums',
        signed ? 'text-negative' : 'text-fg',
        SIZE[size],
        className,
      )}
    >
      {formatMoney(amount)}
    </RNText>
  );
}
