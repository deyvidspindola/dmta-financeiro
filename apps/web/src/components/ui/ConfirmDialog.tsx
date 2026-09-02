import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useConfirmStore } from '@/hooks/useConfirm'
import { strings } from '@/i18n/pt-BR'

/** Host do modal — monte uma vez ao lado do `ToastHost`. */
export function ConfirmDialogHost() {
  const request = useConfirmStore((s) => s.request)
  const settle = useConfirmStore((s) => s.settle)

  if (!request) return null

  const tone = request.tone ?? 'default'
  const title = request.title ?? strings.common.confirmTitle
  const confirmLabel =
    request.confirmLabel ??
    (tone === 'danger' ? strings.common.delete : strings.common.confirm)
  const cancelLabel = request.cancelLabel ?? strings.common.cancel

  return (
    <Modal
      title={title}
      size="sm"
      onClose={() => settle(false)}
      footer={
        <>
          <Button variant="ghost" onClick={() => settle(false)}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={() => settle(true)}
            autoFocus
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-fg-muted">{request.message}</p>
    </Modal>
  )
}
