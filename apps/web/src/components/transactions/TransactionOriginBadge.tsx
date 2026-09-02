import type { CaptureOrigin } from '@/types/models'
import { Badge } from '@/components/ui'
import { strings } from '@/i18n/pt-BR'

export function TransactionOriginBadge({ origin }: { origin: CaptureOrigin }) {
  const label =
    origin in strings.origin
      ? strings.origin[origin as keyof typeof strings.origin]
      : origin

  return <Badge tone="neutral">{label}</Badge>
}
