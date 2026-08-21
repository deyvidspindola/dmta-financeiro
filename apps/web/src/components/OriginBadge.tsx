import { strings } from '@/i18n/pt-BR'
import type { CaptureOrigin } from '@/types/models'

export function OriginBadge({ origin }: { origin: CaptureOrigin }) {
  const label =
    origin in strings.origin
      ? strings.origin[origin as keyof typeof strings.origin]
      : origin

  return (
    <span className={`origin-badge origin-badge--${origin}`} title={label}>
      {label}
    </span>
  )
}
