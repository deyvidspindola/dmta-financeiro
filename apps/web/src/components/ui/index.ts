/**
 * Design system do apps/web (Preline UI + Tailwind v4) — Fase 1 da reforma
 * visual (D-17 / DT-10). Vitrine viva em `/kit` (só em dev).
 *
 * Nomes e props compatíveis com o antigo `ui-legacy` (removido na F4) —
 * migrar era só trocar o import. Vitrine viva em `/kit` (só em dev).
 */
export { Button, IconButton } from './Button'
export type { ButtonVariant, ButtonSize } from './Button'

export { Field, TextInput, Input, TextSelect, Select, Textarea } from './form'

export { Card, CardHeader, Panel, PageHeader } from './Card'

export { Modal } from './Modal'

export { MoneyValue, Money } from './Money'
export type { CreditDebit } from './Money'

export { Badge, CategoryChip } from './Badge'
export type { BadgeTone } from './Badge'

export { DataTable, Tr, Td } from './Table'

export { Stat } from './Stat'

export { ProgressBar, ProgressRing } from './Progress'

export { Tabs } from './Tabs'
export type { TabItem } from './Tabs'

export {
  Spinner,
  LoadingBlock,
  Skeleton,
  EmptyState,
  Alert,
  ErrorBanner,
} from './feedback'

export { AreaChart, BarChart, DonutChart, Sparkline } from './charts'
export { useChartPalette } from './charts/theme'
