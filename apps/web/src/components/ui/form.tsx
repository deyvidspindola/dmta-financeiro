import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { cn } from '@/lib/cn'

const CONTROL = cn(
  'w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-fg',
  'placeholder:text-fg-subtle transition',
  'focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15',
  'disabled:cursor-not-allowed disabled:opacity-60',
  'aria-[invalid=true]:border-negative aria-[invalid=true]:ring-negative/15',
)

/**
 * Rótulo + controle + erro/dica. O `<label>` embrulha o controle
 * (associação implícita) — passe o input/select como `children`. Para
 * marcar estado inválido no controle, passe `aria-invalid` nele.
 */
export function Field({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-fg">
        {label}
        {required ? <span className="ml-0.5 text-negative">*</span> : null}
      </span>
      {children}
      {error ? (
        <span className="text-xs text-negative">{error}</span>
      ) : hint ? (
        <span className="text-xs text-fg-subtle">{hint}</span>
      ) : null}
    </label>
  )
}

export function TextInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, 'h-10', className)} {...props} />
}
export { TextInput as Input }

export function TextSelect({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(CONTROL, 'h-10 pr-8', className)} {...props} />
}
export { TextSelect as Select }

export function Textarea({
  className,
  rows = 3,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea rows={rows} className={cn(CONTROL, 'py-2.5', className)} {...props} />
  )
}
