import { Check, KeyRound, Trash2, X } from 'lucide-react'
import { TransactionOriginBadge } from '@/components/transactions/TransactionOriginBadge'
import { captureStatusTone } from '@/components/billCaptures/captureDisplay'
import {
  Badge,
  DataTable,
  IconButton,
  Money,
  Td,
  Tr,
} from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { formatDate } from '@/lib/format'
import type { BillCapture } from '@/types/models'

const t = strings.billCaptures

type BillCaptureListProps = {
  rows: BillCapture[]
  onConfirm: (capture: BillCapture) => void
  onReject: (captureId: string) => void
  onUnlock: (capture: BillCapture) => void
  onDelete: (captureId: string) => void
  rejectPending?: boolean
  deletePending?: boolean
}

export function BillCaptureList({
  rows,
  onConfirm,
  onReject,
  onUnlock,
  onDelete,
  rejectPending,
  deletePending,
}: BillCaptureListProps) {
  return (
    <DataTable
      headers={[
        t.origin,
        strings.common.actions,
        t.linhaDigitavel,
        { label: strings.bills.amount, right: true },
        strings.bills.dueDate,
        t.beneficiary,
      ]}
    >
      {rows.map((capture) => (
        <Tr key={capture.id}>
          <Td>
            <div className="flex flex-col gap-1">
              <TransactionOriginBadge origin={capture.origin} />
              <Badge tone={captureStatusTone(capture.status)}>
                {t.statuses[capture.status]}
              </Badge>
            </div>
          </Td>
          <Td>
            <div className="flex flex-wrap items-center gap-1">
              {capture.status === 'pending' ? (
                <>
                  <IconButton
                    label={t.confirm}
                    icon={Check}
                    onClick={() => onConfirm(capture)}
                  />
                  <IconButton
                    label={t.reject}
                    icon={X}
                    variant="danger"
                    onClick={() => onReject(capture.id)}
                    disabled={rejectPending}
                  />
                </>
              ) : capture.status === 'password_required' ? (
                <IconButton
                  label={t.unlock}
                  icon={KeyRound}
                  onClick={() => onUnlock(capture)}
                />
              ) : null}
              {capture.status !== 'confirmed' ? (
                <IconButton
                  label={t.delete}
                  icon={Trash2}
                  variant="danger"
                  onClick={() => onDelete(capture.id)}
                  disabled={deletePending}
                />
              ) : (
                <span className="text-sm text-fg-muted">—</span>
              )}
            </div>
          </Td>
          <Td className="font-mono text-xs">
            {capture.linha_digitavel ?? (
              <span className="text-fg-muted">{t.linhaMissing}</span>
            )}
          </Td>
          <Td right>
            {capture.amount === null ? (
              '—'
            ) : (
              <Money amount={capture.amount} />
            )}
          </Td>
          <Td>
            {capture.due_date ? formatDate(capture.due_date) : '—'}
          </Td>
          <Td>{capture.beneficiary ?? '—'}</Td>
        </Tr>
      ))}
    </DataTable>
  )
}
