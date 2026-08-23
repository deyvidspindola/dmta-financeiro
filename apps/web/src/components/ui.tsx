import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react'
import type { LucideIcon } from 'lucide-react'
import { strings } from '@/i18n/pt-BR'
import { formatMoney } from '@/lib/format'

/** Não confundir com `MoneyDirection` (income/expense) de `@/types/models' — este é só o rótulo visual C/D. */
export type CreditDebit = 'credit' | 'debit'

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
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {description ? <p className="muted">{description}</p> : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </header>
  )
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger'
}) {
  return (
    <button
      type="button"
      className={`btn btn--${variant} ${className}`.trim()}
      {...props}
    />
  )
}

/** Compact icon-only control for table row actions (edit, delete, …). */
export function IconButton({
  label,
  icon: Icon,
  variant = 'ghost',
  className = '',
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  label: string
  icon: LucideIcon
  variant?: 'primary' | 'ghost' | 'danger'
}) {
  return (
    <button
      type="button"
      className={`icon-action-btn icon-action-btn--${variant} ${className}`.trim()}
      aria-label={label}
      title={label}
      {...props}
    >
      <Icon size={16} strokeWidth={2} aria-hidden />
    </button>
  )
}

export function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {error ? <span className="field__error">{error}</span> : null}
    </label>
  )
}

export function TextInput(
  props: InputHTMLAttributes<HTMLInputElement>,
) {
  return <input className="input" {...props} />
}

export function TextSelect(
  props: SelectHTMLAttributes<HTMLSelectElement>,
) {
  return <select className="input" {...props} />
}

export function EmptyState({ message }: { message: string }) {
  return <p className="empty-state">{message}</p>
}

export function LoadingBlock({ label }: { label: string }) {
  return <p className="muted loading-block">{label}</p>
}

export function ErrorBanner({ message }: { message: string }) {
  return <div className="error-banner" role="alert">{message}</div>
}

/**
 * Valor monetário com direção visual — verde + "C" (crédito/entrada) ou
 * vermelho + "D" (débito/saída), convenção de extrato bancário. Quem
 * chama decide a direção (receita/boleto a receber = credit; despesa/
 * boleto a pagar = debit; perna de transferência conforme o lado).
 */
export function MoneyValue({
  amount,
  direction,
}: {
  amount: number
  direction: CreditDebit
}) {
  return (
    <span className={`money money--${direction}`}>
      {formatMoney(amount)}
      <span className="money__suffix">{direction === 'credit' ? 'C' : 'D'}</span>
    </span>
  )
}

export function DataTable({
  headers,
  children,
}: {
  headers: string[]
  children: ReactNode
}) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="modal__header">
          <h2>{title}</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label={strings.common.close}
          >
            ×
          </button>
        </header>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  )
}

export function Panel({
  title,
  children,
}: {
  title?: string
  children: ReactNode
}) {
  return (
    <section className="panel">
      {title ? <h2 className="panel__title">{title}</h2> : null}
      {children}
    </section>
  )
}
