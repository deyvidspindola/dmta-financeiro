import Swal from 'sweetalert2'
import { strings } from '@/i18n/pt-BR'

export type ConfirmTone = 'default' | 'danger'

export type ConfirmOptions = {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: ConfirmTone
}

/**
 * Substitui `window.confirm`. Retorna `true` se o usuário confirmar.
 * Usa SweetAlert2 (acima de qualquer modal) com tema alinhado ao app.
 *
 * ```ts
 * const confirm = useConfirm()
 * if (await confirm({ title, message, tone: 'danger' })) { ... }
 * ```
 */
export async function askConfirm(options: ConfirmOptions): Promise<boolean> {
  const tone = options.tone ?? 'default'
  const title = options.title ?? strings.common.confirmTitle
  const confirmLabel =
    options.confirmLabel ??
    (tone === 'danger' ? strings.common.delete : strings.common.confirm)
  const cancelLabel = options.cancelLabel ?? strings.common.cancel

  const result = await Swal.fire({
    title,
    text: options.message,
    icon: tone === 'danger' ? 'warning' : 'question',
    showCancelButton: true,
    focusCancel: true,
    reverseButtons: true,
    confirmButtonText: confirmLabel,
    cancelButtonText: cancelLabel,
    buttonsStyling: false,
    heightAuto: false,
    customClass: {
      popup: 'dmta-swal-popup',
      title: 'dmta-swal-title',
      htmlContainer: 'dmta-swal-body',
      actions: 'dmta-swal-actions',
      confirmButton:
        tone === 'danger' ? 'dmta-swal-confirm-danger' : 'dmta-swal-confirm',
      cancelButton: 'dmta-swal-cancel',
      icon: 'dmta-swal-icon',
    },
  })

  return result.isConfirmed
}

export function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  return askConfirm
}
