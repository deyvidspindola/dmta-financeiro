import type { InputHTMLAttributes } from 'react'
import { useMemo } from 'react'
import { CONTROL } from '@/components/ui/form'
import { formatMoneyInput, parseMoneyInput } from '@/lib/moneyInput'
import { cn } from '@/lib/cn'

type MoneyInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange' | 'inputMode'
> & {
  /** Valor em reais (ex.: `1234.56`). */
  value: number
  onChange: (value: number) => void
}

/**
 * Input monetário pt-BR. O usuário vê `R$ 1.234,56`; o form recebe `number`.
 * Use com `Controller` do react-hook-form (não com `register`).
 */
export function MoneyInput({
  value,
  onChange,
  className,
  disabled,
  ...props
}: MoneyInputProps) {
  const display = useMemo(() => formatMoneyInput(value ?? 0), [value])

  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      disabled={disabled}
      className={cn(CONTROL, 'h-10 tabular-nums', className)}
      value={display}
      onChange={(event) => {
        onChange(parseMoneyInput(event.target.value))
      }}
      onFocus={(event) => event.target.select()}
      {...props}
    />
  )
}
