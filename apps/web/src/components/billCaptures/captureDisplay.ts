import type { BadgeTone } from '@/components/ui'
import type { BillCaptureStatus } from '@/types/models'

export function captureStatusTone(status: BillCaptureStatus): BadgeTone {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'password_required':
      return 'info'
    case 'confirmed':
      return 'success'
    case 'rejected':
      return 'danger'
    default:
      return 'neutral'
  }
}

export function senderDomain(email: string | null): string | null {
  if (!email) return null
  const at = email.lastIndexOf('@')
  if (at < 0) return null
  const domain = email.slice(at + 1).trim().toLowerCase()
  return domain || null
}

export function categoryTypeForDirection(
  direction: 'payable' | 'receivable',
): 'income' | 'expense' {
  return direction === 'receivable' ? 'income' : 'expense'
}
