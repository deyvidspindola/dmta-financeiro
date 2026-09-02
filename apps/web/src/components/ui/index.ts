/**
 * Design system do apps/web (Preline UI + Tailwind v4) — Fase 1 da reforma
 * visual (D-17 / DT-10). Vitrine viva em `/kit` (só em dev).
 *
 * Nomes e props compatíveis com o antigo `ui-legacy` (removido na F4) —
 * migrar era só trocar o import. Vitrine viva em `/kit` (só em dev).
 */
export { Button, IconButton } from './Button'
export type { ButtonVariant, ButtonSize } from './Button'

export { Field, TextInput, Input, TextSelect, Select, Textarea, CONTROL } from './form'

export { MoneyInput } from './MoneyInput'
export { formatMoneyInput, parseMoneyInput } from '@/lib/moneyInput'

export { SwitchField } from './SwitchField'

export { DatePickerField, DateRangeField } from './DatePickerField'
export type { DateRangeValue } from './DatePickerField'

export { ConfirmDialogHost } from './ConfirmDialog'
export { useConfirm } from '@/hooks/useConfirm'
export type { ConfirmOptions, ConfirmTone } from '@/hooks/useConfirm'

export { Card, CardHeader, Panel, PageHeader } from './Card'

export { Modal } from './Modal'

export { MoneyValue, Money } from './Money'
export type { CreditDebit } from './Money'

export { Badge, CategoryChip } from './Badge'
export type { BadgeTone } from './Badge'

export { DataTable, Tr, Td } from './Table'

export { StatementList, StatementGroup, StatementRow } from './StatementList'

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
