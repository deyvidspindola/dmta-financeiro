import { useId } from 'react'
import { cn } from '@/lib/cn'

type SwitchFieldProps = {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  id?: string
  error?: string
}

/**
 * Toggle estilo Preline (checkbox sr-only + trilho). Controlado — use com
 * `Controller` do react-hook-form para campos booleanos.
 */
export function SwitchField({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  id: idProp,
  error,
}: SwitchFieldProps) {
  const autoId = useId()
  const id = idProp ?? autoId

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <label htmlFor={id} className="text-sm font-medium text-fg">
            {label}
          </label>
          {description ? (
            <p className="mt-0.5 text-xs text-fg-subtle">{description}</p>
          ) : null}
        </div>
        <label
          htmlFor={id}
          className={cn(
            'relative inline-block h-6 w-11 shrink-0 cursor-pointer',
            disabled && 'cursor-not-allowed opacity-60',
          )}
        >
          <input
            id={id}
            type="checkbox"
            role="switch"
            className="peer sr-only"
            checked={checked}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            onChange={(event) => onChange(event.target.checked)}
          />
          <span
            aria-hidden
            className={cn(
              'absolute inset-0 rounded-full border border-transparent bg-surface-2 transition',
              'peer-focus-visible:ring-4 peer-focus-visible:ring-brand-500/15',
              'peer-checked:bg-brand-600',
              'peer-disabled:pointer-events-none',
            )}
          />
          <span
            aria-hidden
            className={cn(
              'absolute start-0.5 top-1/2 size-5 -translate-y-1/2 rounded-full bg-white shadow-sm transition',
              'peer-checked:translate-x-full dark:bg-neutral-200 dark:peer-checked:bg-white',
            )}
          />
        </label>
      </div>
      {error ? <span className="text-xs text-negative">{error}</span> : null}
    </div>
  )
}
