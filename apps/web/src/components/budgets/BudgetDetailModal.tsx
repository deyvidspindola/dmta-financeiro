import { useQuery } from '@tanstack/react-query'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowDownLeft,
  Barcode,
  CreditCard,
  Repeat,
} from 'lucide-react'
import { budgetsApi } from '@/api'
import type { BudgetItem, BudgetItemKind, BudgetProgress } from '@/api/budgets'
import {
  Badge,
  CategoryChip,
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  Modal,
  Money,
  ProgressBar,
} from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { formatDateShort } from '@/lib/creditCardInvoices'
import { formatMoney } from '@/lib/format'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/cn'

const t = strings.budgets

const KIND_ICON: Record<BudgetItemKind, LucideIcon> = {
  transaction: ArrowDownLeft,
  bill: Barcode,
  card_purchase: CreditCard,
  recurring_transaction: Repeat,
  recurring_bill: Repeat,
}

type BudgetDetailModalProps = {
  contextId: string
  budget: BudgetProgress
  month: string
  onClose: () => void
}

function sumAmounts(items: BudgetItem[]): number {
  return items.reduce((total, item) => total + item.amount, 0)
}

function BudgetItemRow({
  item,
  budgetCategoryName,
}: {
  item: BudgetItem
  budgetCategoryName: string
}) {
  const Icon = KIND_ICON[item.kind]
  const showSubcategory =
    item.category_name !== null && item.category_name !== budgetCategoryName

  return (
    <li
      className={cn(
        'flex items-start gap-3 rounded-xl px-1 py-2.5',
        !item.effective && 'opacity-80',
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg',
          item.effective ? 'bg-surface-2 text-fg-muted' : 'bg-surface-2/60 text-fg-subtle',
        )}
        title={t.kinds[item.kind]}
      >
        <Icon size={16} aria-label={t.kinds[item.kind]} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-fg">{item.description}</p>
          {!item.effective ? (
            <Badge tone="neutral" className="text-[10px]">
              {t.forecastTag}
            </Badge>
          ) : null}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-fg-subtle">
          <span>{formatDateShort(item.date)}</span>
          {showSubcategory ? (
            <CategoryChip
              name={item.category_name!}
              colorIndex={Number(item.category_id) || 0}
              className="text-[10px]"
            />
          ) : null}
        </div>
      </div>
      <Money
        amount={item.amount}
        size="sm"
        className={cn('shrink-0', !item.effective && 'text-fg-muted')}
      />
    </li>
  )
}

function ItemSection({
  title,
  items,
  budgetCategoryName,
}: {
  title: string
  items: BudgetItem[]
  budgetCategoryName: string
}) {
  if (items.length === 0) return null

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
          {title}
        </h3>
        <Money amount={sumAmounts(items)} size="sm" className="text-fg-muted" />
      </div>
      <ul className="divide-y divide-line">
        {items.map((item, index) => (
          <BudgetItemRow
            key={`${item.kind}-${item.date}-${item.description}-${index}`}
            item={item}
            budgetCategoryName={budgetCategoryName}
          />
        ))}
      </ul>
    </section>
  )
}

export function BudgetDetailModal({
  contextId,
  budget,
  month,
  onClose,
}: BudgetDetailModalProps) {
  const detail = useQuery({
    queryKey: ['budget-detail', contextId, budget.budget_id, month],
    queryFn: () =>
      budgetsApi.getBudgetDetail(contextId, budget.budget_id, month),
  })

  const data = detail.data
  const pct = Math.min(100, budget.percent)
  const tone = budget.over ? 'negative' : pct > 85 ? 'warning' : 'brand'

  const categoryName = data?.category_name ?? budget.category_name
  const spent = data?.spent ?? budget.spent
  const spentEffective = data?.spent_effective ?? budget.spent_effective
  const limit = data?.limit ?? budget.limit
  const items = data?.items ?? []

  const spentItems = items.filter((item) => item.effective)
  const forecastItems = items.filter((item) => !item.effective)

  return (
    <Modal title={t.detailTitle} onClose={onClose} size="lg">
      <div className="space-y-5">
        <div className="space-y-3">
          <CategoryChip name={categoryName} colorIndex={budget.category_id} />
          <ProgressBar
            value={pct}
            tone={tone}
            label={`${categoryName}: ${pct}%`}
          />
          <div className="text-sm">
            <p className="text-fg">
              <Money amount={spent} size="sm" />
              <span className="text-fg-muted">
                {' '}
                {t.ofLimit}{' '}
                <Money amount={limit} size="sm" className="inline" />
              </span>
            </p>
            {spentEffective !== spent ? (
              <p className="mt-0.5 text-xs text-fg-subtle">
                {t.effectiveVsProjected(
                  formatMoney(spentEffective),
                  formatMoney(spent),
                )}
              </p>
            ) : null}
          </div>
        </div>

        {detail.isLoading ? (
          <LoadingBlock label={strings.common.loading} />
        ) : null}

        {detail.isError ? (
          <ErrorBanner message={getErrorMessage(detail.error)} />
        ) : null}

        {detail.isSuccess && items.length === 0 ? (
          <EmptyState message={t.emptyConsumption} />
        ) : null}

        {detail.isSuccess && items.length > 0 ? (
          <div className="space-y-6">
            <ItemSection
              title={t.sectionSpent}
              items={spentItems}
              budgetCategoryName={categoryName}
            />
            <ItemSection
              title={t.sectionForecast}
              items={forecastItems}
              budgetCategoryName={categoryName}
            />
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
