import { CheckCircle2, X, XCircle } from 'lucide-react'
import { IconButton } from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { cn } from '@/lib/cn'
import { useToastStore } from '@/store/toastStore'

const TONE = {
  success: {
    cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
    icon: CheckCircle2,
  },
  error: {
    cls: 'border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-200',
    icon: XCircle,
  },
} as const

export function ToastHost() {
  const { toasts, dismiss } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-3 bottom-20 z-[100] flex flex-col gap-2 sm:inset-x-auto sm:right-4 sm:bottom-4 lg:bottom-4"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((toast) => {
        const { cls, icon: Icon } = TONE[toast.tone]
        return (
          <div
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 text-sm shadow-pop',
              cls,
            )}
          >
            <Icon size={18} className="mt-0.5 shrink-0" aria-hidden />
            <span className="min-w-0 flex-1">{toast.message}</span>
            <IconButton
              label={strings.toast.close}
              icon={X}
              variant="ghost"
              size="sm"
              className="shrink-0 -mr-1 -mt-0.5"
              onClick={() => dismiss(toast.id)}
            />
          </div>
        )
      })}
    </div>
  )
}
