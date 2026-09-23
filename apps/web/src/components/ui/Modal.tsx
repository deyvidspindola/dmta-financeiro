import type { ReactNode } from 'react'
import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import { strings } from '@/i18n/pt-BR'
import { cn } from '@/lib/cn'
import { lockBodyScroll } from '@/lib/scrollLock'

type Size = 'sm' | 'md' | 'lg' | 'xl'
const WIDTH: Record<Size, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

/**
 * Diálogo modal controlado por estado do React (não usa o overlay do
 * Preline). Fecha no Esc e no clique fora; prende o foco enquanto aberto;
 * trava o scroll do body. Renderize condicionalmente — `{open && <Modal/>}`.
 */
export function Modal({
  title,
  onClose,
  children,
  footer,
  size = 'md',
}: {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  size?: Size
}) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  // Trava o scroll uma vez por modal montado (não por render — `onClose`
  // costuma ser arrow inline e mudaria a cada render).
  useEffect(() => lockBodyScroll(), [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    first?.focus()

    function trapFocus(event: KeyboardEvent) {
      if (event.key !== 'Tab' || focusable.length === 0) return
      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        }
      } else if (document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }

    dialog.addEventListener('keydown', trapFocus)
    return () => dialog.removeEventListener('keydown', trapFocus)
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'flex max-h-[94dvh] w-full flex-col overflow-hidden bg-surface shadow-pop sm:max-h-[calc(100dvh-2rem)]',
          'rounded-t-2xl sm:rounded-2xl',
          WIDTH[size],
        )}
      >
        <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2
            id={titleId}
            className="font-display text-base font-semibold text-fg"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={strings.common.close}
            className="-mr-1.5 inline-flex size-8 items-center justify-center rounded-lg text-fg-muted transition hover:bg-surface-2 hover:text-fg"
          >
            <X size={18} aria-hidden />
          </button>
        </header>
        <div className="grow overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <footer className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  )
}
