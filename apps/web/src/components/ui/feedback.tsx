import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

export function Spinner({
  size = 20,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      className={cn('animate-spin text-brand-600', className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="carregando"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-20"
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

export function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-sm text-fg-muted">
      <Spinner size={18} />
      {label}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-surface-2', className)}
      aria-hidden
    />
  )
}

export function EmptyState({
  message,
  icon: Icon,
  action,
}: {
  message: string
  icon?: LucideIcon
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-12 text-center">
      {Icon ? (
        <span className="flex size-11 items-center justify-center rounded-xl bg-surface-2 text-fg-subtle">
          <Icon size={20} aria-hidden />
        </span>
      ) : null}
      <p className="text-sm text-fg-muted">{message}</p>
      {action}
    </div>
  )
}

type AlertTone = 'info' | 'success' | 'warning' | 'danger'
const ALERT: Record<AlertTone, { cls: string; icon: LucideIcon }> = {
  info: { cls: 'border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200', icon: Info },
  success: {
    cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
    icon: CheckCircle2,
  },
  warning: {
    cls: 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200',
    icon: AlertTriangle,
  },
  danger: {
    cls: 'border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-200',
    icon: XCircle,
  },
}

export function Alert({
  children,
  tone = 'info',
  title,
}: {
  children: ReactNode
  tone?: AlertTone
  title?: string
}) {
  const { cls, icon: Icon } = ALERT[tone]
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-xl border p-3.5 text-sm', cls)}
    >
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden />
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className={title ? 'mt-0.5' : undefined}>{children}</div>
      </div>
    </div>
  )
}

/** Compat com o `ErrorBanner` legado. */
export function ErrorBanner({ message }: { message: string }) {
  return <Alert tone="danger">{message}</Alert>
}
