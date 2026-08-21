import { useToastStore } from '@/store/toastStore'

export function ToastHost() {
  const { toasts, dismiss } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="toast-host" aria-live="polite" aria-relevant="additions">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast--${toast.tone}`}
          role={toast.tone === 'error' ? 'alert' : 'status'}
        >
          <span>{toast.message}</span>
          <button
            type="button"
            className="toast__close"
            onClick={() => dismiss(toast.id)}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
