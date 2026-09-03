import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { consolidatedApi, creditCardsApi } from '@/api'
import {
  CardFormModal,
  PayModal,
  PurchaseModal,
} from '@/components/creditCards/CreditCardModals'
import { InvoiceChipStrip } from '@/components/creditCards/InvoiceChipStrip'
import { InvoiceNavigator } from '@/components/creditCards/InvoiceNavigator'
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  ErrorBanner,
  IconButton,
  LoadingBlock,
  Money,
  ProgressBar,
  Td,
  Tr,
  useConfirm,
} from '@/components/ui'
import { useWritableContextId } from '@/hooks/useWritableContextId'
import { strings } from '@/i18n/pt-BR'
import {
  buildInvoiceTimeline,
  findDefaultInvoiceMonth,
  formatDateShort,
} from '@/lib/creditCardInvoices'
import { getErrorMessage } from '@/lib/errors'
import { formatDate, formatMoney } from '@/lib/format'
import { cn } from '@/lib/cn'
import { toastError, toastSuccess } from '@/store/toastStore'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'
import type { CardPurchase } from '@/types/models'

const t = strings.creditCards

const STATUS_LABEL: Record<string, string> = {
  open: t.open,
  closed: t.closed,
  paid: t.paid,
}

function isPurchaseEditable(
  purchase: CardPurchase,
  invoiceStatus: string | undefined,
): boolean {
  return purchase.installment_number == null && invoiceStatus !== 'paid'
}

export function CreditCardDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const writableContextId = useWritableContextId()
  const activeScope = useAuthStore((s) => s.activeScope)
  const isConsolidated = activeScope === CONSOLIDATED

  const [selectedMonthOverride, setSelectedMonthOverride] = useState<string | null>(
    null,
  )
  const confirm = useConfirm()
  const [editModal, setEditModal] = useState(false)
  const [purchaseModal, setPurchaseModal] = useState(false)
  const [editingPurchase, setEditingPurchase] = useState<CardPurchase | null>(null)
  const [payInvoiceId, setPayInvoiceId] = useState<string | null>(null)

  const urlContextId =
    searchParams.get('context') ??
    (activeScope !== CONSOLIDATED ? activeScope : null)

  const cards = useQuery({
    queryKey: ['credit-cards', activeScope],
    queryFn: () =>
      isConsolidated
        ? consolidatedApi.listConsolidatedCreditCards()
        : creditCardsApi.listCreditCards(activeScope),
    enabled: Boolean(activeScope),
  })

  const card = useMemo(() => {
    const rows = cards.data ?? []
    if (urlContextId) {
      return rows.find((row) => row.id === id && row.context_id === urlContextId)
    }
    return rows.find((row) => row.id === id)
  }, [cards.data, urlContextId, id])

  const cardContextId = card?.context_id ?? urlContextId
  const canMutate = Boolean(writableContextId) && !isConsolidated

  const invoices = useQuery({
    queryKey: ['card-invoices', cardContextId, id],
    queryFn: () =>
      creditCardsApi.listInvoicesForCard(cardContextId as string, id as string),
    enabled: Boolean(cardContextId && id && card),
  })

  const timeline = useMemo(() => {
    if (!card) return []
    return buildInvoiceTimeline(invoices.data ?? [], card.due_day)
  }, [card, invoices.data])

  const defaultMonth = useMemo(() => {
    if (timeline.length === 0) return null
    return findDefaultInvoiceMonth(invoices.data ?? [], timeline)
  }, [timeline, invoices.data])

  const selectedMonth = selectedMonthOverride ?? defaultMonth
  const setSelectedMonth = (month: string) => setSelectedMonthOverride(month)

  const selectedEntry = timeline.find(
    (entry) => entry.reference_month === selectedMonth,
  )
  const realInvoice = selectedEntry?.invoice ?? null

  const purchases = useQuery({
    queryKey: ['card-purchases', cardContextId, id, realInvoice?.id],
    queryFn: () =>
      creditCardsApi.listCardPurchases(
        cardContextId as string,
        id as string,
        realInvoice!.id,
      ),
    enabled: Boolean(cardContextId && id && realInvoice),
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['credit-cards'] })
    void queryClient.invalidateQueries({ queryKey: ['card-invoices'] })
    void queryClient.invalidateQueries({ queryKey: ['card-purchases'] })
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    void queryClient.invalidateQueries({ queryKey: ['accounts'] })
    void queryClient.invalidateQueries({ queryKey: ['budgets'] })
  }

  const removePurchase = useMutation({
    mutationFn: ({ purchase, group }: { purchase: CardPurchase; group: boolean }) =>
      creditCardsApi.deleteCardPurchase(
        cardContextId as string,
        id as string,
        purchase.id,
        group ? 'group' : undefined,
      ),
    onSuccess: () => {
      invalidate()
      toastSuccess(t.purchaseDeleted)
    },
    onError: (error) => toastError(getErrorMessage(error)),
  })

  async function handleDeletePurchase(purchase: CardPurchase) {
    const group = (purchase.installment_total ?? 0) > 1
    const message = group
      ? t.confirmDeletePurchaseGroup(purchase.installment_total ?? 0)
      : t.confirmDeletePurchase
    if (!(await confirm({ message, tone: 'danger', confirmLabel: strings.common.delete }))) {
      return
    }
    removePurchase.mutate({ purchase, group })
  }

  const selectedIdx = timeline.findIndex(
    (entry) => entry.reference_month === selectedMonth,
  )

  function goToOffset(delta: number) {
    if (selectedIdx < 0) return
    const next = timeline[selectedIdx + delta]
    if (next) setSelectedMonth(next.reference_month)
  }

  if (cards.isLoading) {
    return <LoadingBlock label={strings.common.loading} />
  }

  if (cards.isError) {
    return (
      <div className="space-y-4 bg-canvas text-fg">
        <ErrorBanner message={getErrorMessage(cards.error)} />
        <Link
          to="/credit-cards"
          className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
        >
          <ArrowLeft size={16} aria-hidden />
          {t.back}
        </Link>
      </div>
    )
  }

  if (!card || !cardContextId) {
    return (
      <div className="space-y-4 bg-canvas text-fg">
        <ErrorBanner message={t.notFound} />
        <Link
          to="/credit-cards"
          className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
        >
          <ArrowLeft size={16} aria-hidden />
          {t.back}
        </Link>
      </div>
    )
  }

  const used = card.unpaid_invoices_total
  const usedPct =
    card.limit > 0 ? Math.min(100, Math.round((used / card.limit) * 100)) : 0
  const progressTone =
    usedPct >= 100 ? 'negative' : usedPct >= 80 ? 'warning' : 'brand'

  const invoiceStatus = realInvoice?.status
  const statusLine = selectedEntry?.isSynthetic
    ? t.forecast
    : invoiceStatus === 'open'
      ? `${t.statusOpen} · ${t.dueOn} ${formatDateShort(selectedEntry?.due_date ?? '')}`
      : invoiceStatus === 'closed'
        ? `${t.closed} · ${t.dueOn} ${formatDateShort(selectedEntry?.due_date ?? '')}`
        : invoiceStatus === 'paid'
          ? t.paid
          : t.forecast

  const invoiceAmount = realInvoice?.amount ?? 0

  return (
    <div className="space-y-6 bg-canvas text-fg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/credit-cards"
          className="inline-flex items-center gap-1.5 text-sm text-fg-muted transition hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          <ArrowLeft size={16} aria-hidden />
          {t.back}
        </Link>
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1 px-2">
          <div className="flex max-w-full items-center justify-center gap-2">
            <h1 className="truncate font-display text-lg font-bold sm:text-xl">
              {card.name}
            </h1>
            {card.brand ? <Badge tone="brand">{card.brand}</Badge> : null}
          </div>
          {isConsolidated && card.context ? (
            <Badge tone="accent">{card.context.name}</Badge>
          ) : null}
        </div>
        {canMutate ? (
          <div className="flex shrink-0 gap-2">
            <Button variant="ghost" size="sm" onClick={() => setPurchaseModal(true)}>
              <Plus size={16} />
              <span className="hidden sm:inline">{t.newPurchase}</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setEditModal(true)}>
              <Pencil size={16} />
              <span className="hidden sm:inline">{strings.common.edit}</span>
            </Button>
          </div>
        ) : (
          <div className="w-10" aria-hidden />
        )}
      </div>

      {isConsolidated ? (
        <p className="text-sm text-fg-muted">{strings.common.consolidatedHint}</p>
      ) : null}

      <div className="space-y-3 border-y border-line py-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span>
            {t.limit}{' '}
            <strong className="tabular-nums">{formatMoney(card.limit)}</strong>
          </span>
          <span className="text-fg-muted">·</span>
          <span>
            {t.usedLabel} {usedPct}%
          </span>
          <span className="text-fg-muted">·</span>
          <span>{t.closesOnDay(card.closing_day)}</span>
          <span className="text-fg-muted">·</span>
          <span>{t.dueOnDay(card.due_day)}</span>
          <ProgressBar
            value={usedPct}
            tone={progressTone}
            className="h-2 w-full max-w-[140px] sm:w-28"
            label={`${t.usedLabel} ${usedPct}%`}
          />
          <span className="ml-auto text-sm">
            {t.available}{' '}
            <strong className="tabular-nums text-brand-700 dark:text-brand-300">
              {card.available_limit === null
                ? '—'
                : formatMoney(card.available_limit)}
            </strong>
          </span>
        </div>
      </div>

      <div className="flex justify-center">
        <InvoiceNavigator
          referenceMonth={selectedMonth ?? timeline[0]?.reference_month ?? ''}
          onPrev={() => goToOffset(-1)}
          onNext={() => goToOffset(1)}
          canPrev={selectedIdx > 0}
          canNext={selectedIdx >= 0 && selectedIdx < timeline.length - 1}
        />
      </div>

      {invoices.isLoading ? (
        <LoadingBlock label={strings.common.loading} />
      ) : invoices.isError ? (
        <ErrorBanner message={getErrorMessage(invoices.error)} />
      ) : (
        <>
          <InvoiceChipStrip
            timeline={timeline}
            selectedMonth={selectedMonth ?? ''}
            onSelect={setSelectedMonth}
          />

          <section className="flex flex-col items-center gap-2 py-4 text-center">
            <p
              className={cn(
                'text-sm',
                invoiceStatus === 'open'
                  ? 'text-brand-700 dark:text-brand-300'
                  : 'text-fg-muted',
              )}
            >
              {invoiceStatus === 'open' ? (
                <span className="mr-1 inline-block size-2 rounded-full bg-brand-500 align-middle" />
              ) : null}
              {statusLine}
              {realInvoice ? (
                <span className="sr-only">
                  {STATUS_LABEL[realInvoice.status]}
                </span>
              ) : null}
            </p>
            <Money
              amount={invoiceAmount}
              size="xl"
              className={selectedEntry?.isSynthetic ? 'text-fg-muted' : undefined}
            />
            {canMutate && realInvoice?.status === 'closed' ? (
              <Button className="mt-2" onClick={() => setPayInvoiceId(realInvoice.id)}>
                {t.payInvoiceBtn}
              </Button>
            ) : null}
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-base font-semibold">
              {t.invoicePurchases}
            </h2>
            {realInvoice ? (
              purchases.isLoading ? (
                <LoadingBlock label={strings.common.loading} />
              ) : purchases.isError ? (
                <ErrorBanner message={getErrorMessage(purchases.error)} />
              ) : (purchases.data ?? []).length === 0 ? (
                <EmptyState message={t.noPurchases} />
              ) : (
                <DataTable
                  headers={[
                    strings.quickAdd.date,
                    strings.quickAdd.description,
                    { label: strings.quickAdd.amount, right: true },
                    ...(canMutate
                      ? [{ label: strings.common.actions, right: true }]
                      : []),
                  ]}
                >
                  {(purchases.data ?? []).map((purchase) => {
                    const editable = isPurchaseEditable(
                      purchase,
                      realInvoice?.status,
                    )
                    return (
                      <Tr key={purchase.id}>
                        <Td className="whitespace-nowrap text-fg-muted">
                          {formatDate(purchase.occurred_at)}
                        </Td>
                        <Td>
                          {purchase.description}
                          {purchase.installment_total &&
                          purchase.installment_total > 1
                            ? ` (${purchase.installment_number}/${purchase.installment_total})`
                            : ''}
                        </Td>
                        <Td right>
                          <span className="font-semibold tabular-nums">
                            {formatMoney(purchase.amount)}
                          </span>
                        </Td>
                        {canMutate ? (
                          <Td right>
                            <div className="inline-flex items-center gap-1">
                              {editable ? (
                                <IconButton
                                  label={strings.common.edit}
                                  icon={Pencil}
                                  size="sm"
                                  onClick={() => setEditingPurchase(purchase)}
                                />
                              ) : (
                                <span
                                  className="inline-flex"
                                  title={t.editPurchaseBlocked}
                                >
                                  <IconButton
                                    label={t.editPurchaseBlocked}
                                    icon={Pencil}
                                    size="sm"
                                    disabled
                                  />
                                </span>
                              )}
                              {realInvoice?.status !== 'paid' ? (
                                <IconButton
                                  label={strings.common.delete}
                                  icon={Trash2}
                                  size="sm"
                                  variant="danger"
                                  disabled={removePurchase.isPending}
                                  onClick={() => handleDeletePurchase(purchase)}
                                />
                              ) : null}
                            </div>
                          </Td>
                        ) : null}
                      </Tr>
                    )
                  })}
                </DataTable>
              )
            ) : (
              <EmptyState message={t.noPurchasesForecast} />
            )}
          </section>
        </>
      )}

      {editModal && writableContextId ? (
        <CardFormModal
          contextId={writableContextId}
          editing={card}
          onClose={() => setEditModal(false)}
          onSaved={() => {
            invalidate()
            setEditModal(false)
          }}
          onDeleted={() => {
            setEditModal(false)
            void navigate('/credit-cards')
          }}
        />
      ) : null}

      {purchaseModal && writableContextId ? (
        <PurchaseModal
          contextId={writableContextId}
          cards={[card]}
          defaultCardId={card.id}
          onClose={() => setPurchaseModal(false)}
          onSaved={() => {
            invalidate()
            setPurchaseModal(false)
          }}
        />
      ) : null}

      {editingPurchase && writableContextId ? (
        <PurchaseModal
          contextId={writableContextId}
          cards={[card]}
          defaultCardId={card.id}
          editing={editingPurchase}
          onClose={() => setEditingPurchase(null)}
          onSaved={() => {
            invalidate()
            setEditingPurchase(null)
          }}
        />
      ) : null}

      {payInvoiceId && writableContextId ? (
        <PayModal
          contextId={writableContextId}
          invoiceId={payInvoiceId}
          cardId={card.id}
          onClose={() => setPayInvoiceId(null)}
          onPaid={() => {
            invalidate()
            setPayInvoiceId(null)
          }}
        />
      ) : null}
    </div>
  )
}
