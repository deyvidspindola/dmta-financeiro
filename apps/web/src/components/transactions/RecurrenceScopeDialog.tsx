import type { RecurrenceEditScope } from '@/api/transactions'
import { Button, Modal } from '@/components/ui'
import { strings } from '@/i18n/pt-BR'

const s = strings.transactionDetail.scopeDialog

type RecurrenceScopeDialogProps = {
  action: 'edit' | 'delete'
  onChoose: (scope: RecurrenceEditScope) => void
  onCancel: () => void
}

/**
 * "Só este / este e os futuros / todos" — pedido quando a edição/exclusão
 * é num lançamento que veio de uma recorrência (mesmo padrão de agenda:
 * Google Calendar). Fora daqui, edição/exclusão avulsa continua o
 * confirm de sempre.
 */
export function RecurrenceScopeDialog({ action, onChoose, onCancel }: RecurrenceScopeDialogProps) {
  const isDelete = action === 'delete'

  return (
    <Modal title={isDelete ? s.deleteTitle : s.editTitle} onClose={onCancel}>
      <div className="grid gap-3">
        <p className="text-sm text-fg-muted">{isDelete ? s.deleteMessage : s.editMessage}</p>
        <div className="grid gap-2">
          <Button variant="secondary" onClick={() => onChoose('this')}>
            {s.this}
          </Button>
          <Button variant="secondary" onClick={() => onChoose('future')}>
            {s.future}
          </Button>
          <Button variant={isDelete ? 'danger' : 'secondary'} onClick={() => onChoose('all')}>
            {s.all}
          </Button>
          <p className="text-xs text-fg-subtle">{s.allHint}</p>
        </div>
        <div className="flex justify-end pt-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {strings.common.cancel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
