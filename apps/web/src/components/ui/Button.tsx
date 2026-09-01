import type { ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'subtle'
export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white shadow-card hover:bg-brand-700 focus-visible:outline-brand-600',
  secondary:
    'border border-line bg-surface text-fg hover:bg-surface-2 focus-visible:outline-brand-600',
  ghost:
    'text-fg-muted hover:bg-surface-2 hover:text-fg focus-visible:outline-brand-600',
  subtle:
    'bg-brand-500/12 text-brand-700 hover:bg-brand-500/20 focus-visible:outline-brand-600 dark:text-brand-300',
  danger:
    'bg-negative text-white hover:opacity-90 focus-visible:outline-negative',
}

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-3 text-xs',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2 px-5 text-sm',
}

const ICON_SIZE: Record<ButtonSize, number> = { sm: 14, md: 16, lg: 18 }

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: LucideIcon
  iconRight?: LucideIcon
  block?: boolean
}

/**
 * Botão base do design system. `type="button"` por padrão — passe
 * `type="submit"` explicitamente em formulários. `loading` desabilita e
 * troca o ícone da esquerda por um spinner.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  iconRight: IconRight,
  block = false,
  className,
  disabled,
  children,
  type = 'button',
  ...props
}: Props) {
  const s = ICON_SIZE[size]
  return (
    <button
      // eslint-disable-next-line react/button-has-type
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition',
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        block && 'w-full',
        SIZE[size],
        VARIANT[variant],
        className,
      )}
      {...props}
    >
      {loading ? (
        <Spinner size={s} />
      ) : Icon ? (
        <Icon size={s} strokeWidth={2} aria-hidden />
      ) : null}
      {children}
      {IconRight && !loading ? (
        <IconRight size={s} strokeWidth={2} aria-hidden />
      ) : null}
    </button>
  )
}

/** Controle só-ícone para ações de linha de tabela (editar, excluir…). */
export function IconButton({
  label,
  icon: Icon,
  variant = 'ghost',
  size = 'md',
  className,
  type = 'button',
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  label: string
  icon: LucideIcon
  variant?: ButtonVariant
  size?: Exclude<ButtonSize, 'lg'>
}) {
  return (
    <button
      // eslint-disable-next-line react/button-has-type
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-lg transition',
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        size === 'sm' ? 'size-8' : 'size-10',
        VARIANT[variant],
        className,
      )}
      {...props}
    >
      <Icon size={size === 'sm' ? 15 : 17} strokeWidth={2} aria-hidden />
    </button>
  )
}

function Spinner({ size }: { size: number }) {
  return (
    <svg
      className="animate-spin"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}
