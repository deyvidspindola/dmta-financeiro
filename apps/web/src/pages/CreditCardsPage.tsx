import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChevronDown,
  ChevronRight,
  CreditCard as CardIcon,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { accountsApi, categoriesApi, creditCardsApi } from '@/api'
import {
  Button,
  EmptyState,
  ErrorBanner,
  Field,
  IconButton,
  LoadingBlock,
  Modal,
  PageHeader,
  TextInput,
  TextSelect,
} from '@/components/ui'
import { useWritableContextId } from '@/hooks/useWritableContextId'
import { strings } from '@/i18n/pt-BR'
import { currentMonthKey } from '@/lib/dates'
import { getErrorMessage } from '@/lib/errors'
import { formatDate, formatMoney } from '@/lib/format'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'
import { toastError, toastSuccess } from '@/store/toastStore'
import type { CreditCard } from '@/types/models'

const t = strings.creditCards

function today(): string {
  return `${currentMonthKey()}-${String(new Date().getDate()).padStart(2, '0')}`
}

const STATUS_LABEL: Record<string, string> = {
  open: t.open,
  closed: t.closed,
  paid: t.paid,
}

export function CreditCardsPage() {
  const queryClient = useQueryClient()
  const contextId = useWritableContextId()
  const activeScope = useAuthStore((s) => s.activeScope)
  const consolidated = activeScope === CONSOLIDATED

  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null)
  const [cardModal, setCardModal] = useState<{ editing: CreditCard | null } | null>(null)
  const [purchaseModal, setPurchaseModal] = useState(false)
  const [payInvoiceId, setPayInvoiceId] = useState<{ id: string; cardId: string } | null>(null)

  const cards = useQuery({
    queryKey: ['credit-cards', contextId],
    queryFn: () => creditCardsApi.listCreditCards(contextId as string),
    enabled: Boolean(contextId) && !consolidated,
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['credit-cards'] })
    void queryClient.invalidateQueries({ queryKey: ['card-invoices'] })
    void queryClient.invalidateQueries({ queryKey: ['card-purchases'] })
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    void queryClient.invalidateQueries({ queryKey: ['accounts'] })
  }

  const removeCard = useMutation({
    mutationFn: (id: string) => creditCardsApi.deleteCreditCard(contextId as string, id),
    onSuccess: () => {
      invalidate()
      toastSuccess(t.deleted)
    },
    onError: (error) => toastError(getErrorMessage(error)),
  })

  if (!contextId || consolidated) {
    return (
      <div className="page">
        <PageHeader title={t.title} />
        <ErrorBanner message="Selecione um contexto (PF ou empresa) para ver os cartões." />
      </div>
    )
  }

  const rows = cards.data ?? []

  return (
    <div className="page">
      <PageHeader
        title={t.title}
        actions={
          <>
            <Button
              variant="ghost"
              onClick={() => setPurchaseModal(true)}
              disabled={rows.length === 0}
            >
              <Plus size={16} /> {t.newPurchase}
            </Button>
            <Button onClick={() => setCardModal({ editing: null })}>
              <Plus size={16} /> {t.create}
            </Button>
          </>
        }
      />

      {cards.isLoading ? <LoadingBlock label={strings.common.loading} /> : null}
      {cards.isError ? <ErrorBanner message={getErrorMessage(cards.error)} /> : null}
      {!cards.isLoading && rows.length === 0 ? (
        <EmptyState message={t.empty} />
      ) : null}

      <div className="card-list">
        {rows.map((card) => (
          <CardBlock
            key={card.id}
            contextId={contextId}
            card={card}
            expanded={expandedCard === card.id}
            onToggle={() =>
              setExpandedCard((current) => (current === card.id ? null : card.id))
            }
            expandedInvoice={expandedInvoice}
            onToggleInvoice={(invoiceId) =>
              setExpandedInvoice((current) =>
                current === invoiceId ? null : invoiceId,
              )
            }
            onEdit={() => setCardModal({ editing: card })}
            onDelete={() => {
              if (window.confirm(t.confirmDelete)) removeCard.mutate(card.id)
            }}
            onPay={(invoiceId) => setPayInvoiceId({ id: invoiceId, cardId: card.id })}
          />
        ))}
      </div>

      {cardModal ? (
        <CardFormModal
          contextId={contextId}
          editing={cardModal.editing}
          onClose={() => setCardModal(null)}
          onSaved={() => {
            invalidate()
            setCardModal(null)
          }}
        />
      ) : null}

      {purchaseModal ? (
        <PurchaseModal
          contextId={contextId}
          cards={rows}
          onClose={() => setPurchaseModal(false)}
          onSaved={() => {
            invalidate()
            setPurchaseModal(false)
          }}
        />
      ) : null}

      {payInvoiceId ? (
        <PayModal
          contextId={contextId}
          invoiceId={payInvoiceId.id}
          cardId={payInvoiceId.cardId}
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

function CardBlock({
  contextId,
  card,
  expanded,
  onToggle,
  expandedInvoice,
  onToggleInvoice,
  onEdit,
  onDelete,
  onPay,
}: {
  contextId: string
  card: CreditCard
  expanded: boolean
  onToggle: () => void
  expandedInvoice: string | null
  onToggleInvoice: (invoiceId: string) => void
  onEdit: () => void
  onDelete: () => void
  onPay: (invoiceId: string) => void
}) {
  const invoices = useQuery({
    queryKey: ['card-invoices', contextId, card.id],
    queryFn: () => creditCardsApi.listInvoicesForCard(contextId, card.id),
    enabled: expanded,
  })

  const used = card.unpaid_invoices_total
  const pct =
    card.limit > 0 ? Math.min(100, Math.round((used / card.limit) * 100)) : 0

  return (
    <div className="cc-card">
      <div className="cc-card__top">
        <button type="button" className="cc-card__toggle" onClick={onToggle}>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <CardIcon size={18} />
          <strong>{card.name}</strong>
          {card.brand ? <span className="muted small">{card.brand}</span> : null}
        </button>
        <div className="actions-cell">
          <IconButton label={strings.common.edit} icon={Pencil} onClick={onEdit} />
          <IconButton
            label={strings.common.delete}
            icon={Trash2}
            variant="danger"
            onClick={onDelete}
          />
        </div>
      </div>

      <div className="cc-card__limit">
        <div className="budget-bar">
          <div
            className={`budget-bar__fill${pct >= 100 ? ' is-over' : ''}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="cc-card__limit-foot">
          <span>
            {t.used}: <strong>{formatMoney(used)}</strong>
          </span>
          <span className="muted">
            {card.available_limit === null
              ? `${t.limit}: —`
              : `${t.available}: ${formatMoney(card.available_limit)}`}
          </span>
        </div>
        {card.current_invoice_total > 0 ? (
          <p className="muted small">
            {t.currentInvoice}: {formatMoney(card.current_invoice_total)}
          </p>
        ) : null}
      </div>

      {expanded ? (
        <div className="cc-card__invoices">
          {invoices.isLoading ? (
            <LoadingBlock label={strings.common.loading} />
          ) : null}
          {(invoices.data ?? []).length === 0 && !invoices.isLoading ? (
            <p className="muted small">{t.noInvoices}</p>
          ) : null}
          {(invoices.data ?? []).map((invoice) => (
            <div key={invoice.id} className="cc-invoice">
              <button
                type="button"
                className="cc-invoice__row"
                onClick={() => onToggleInvoice(invoice.id)}
              >
                {expandedInvoice === invoice.id ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
                <span className="cc-invoice__ref">
                  {invoice.reference_month}
                </span>
                <span className={`cc-badge cc-badge--${invoice.status}`}>
                  {STATUS_LABEL[invoice.status] ?? invoice.status}
                </span>
                <span className="mono">{formatMoney(invoice.amount)}</span>
                <span className="muted small">{formatDate(invoice.due_date)}</span>
              </button>
              {invoice.status !== 'paid' ? (
                <Button variant="ghost" onClick={() => onPay(invoice.id)}>
                  {t.pay}
                </Button>
              ) : null}
              {expandedInvoice === invoice.id ? (
                <InvoicePurchases
                  contextId={contextId}
                  cardId={card.id}
                  invoiceId={invoice.id}
                />
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function InvoicePurchases({
  contextId,
  cardId,
  invoiceId,
}: {
  contextId: string
  cardId: string
  invoiceId: string
}) {
  const purchases = useQuery({
    queryKey: ['card-purchases', contextId, cardId, invoiceId],
    queryFn: () => creditCardsApi.listCardPurchases(contextId, cardId, invoiceId),
  })

  if (purchases.isLoading) return <LoadingBlock label={strings.common.loading} />
  const rows = purchases.data ?? []
  if (rows.length === 0) return <p className="muted small">{t.noPurchases}</p>

  return (
    <ul className="cc-purchases">
      {rows.map((purchase) => (
        <li key={purchase.id}>
          <span>
            {purchase.description}
            {purchase.installment_total && purchase.installment_total > 1
              ? ` (${purchase.installment_number}/${purchase.installment_total})`
              : ''}
          </span>
          <span className="mono">{formatMoney(purchase.amount)}</span>
        </li>
      ))}
    </ul>
  )
}

function CardFormModal({
  contextId,
  editing,
  onClose,
  onSaved,
}: {
  contextId: string
  editing: CreditCard | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(editing?.name ?? '')
  const [brand, setBrand] = useState(editing?.brand ?? '')
  const [limit, setLimit] = useState(String(editing?.limit ?? ''))
  const [closingDay, setClosingDay] = useState(String(editing?.closing_day ?? 5))
  const [dueDay, setDueDay] = useState(String(editing?.due_day ?? 12))

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        name,
        brand: brand || null,
        limit: Number(limit),
        closing_day: Number(closingDay),
        due_day: Number(dueDay),
      }
      return editing
        ? creditCardsApi.updateCreditCard(contextId, editing.id, payload)
        : creditCardsApi.createCreditCard(contextId, payload)
    },
    onSuccess: () => {
      toastSuccess(editing ? t.updated : t.created)
      onSaved()
    },
    onError: (error) => toastError(getErrorMessage(error)),
  })

  return (
    <Modal title={editing ? t.edit : t.create} onClose={onClose}>
      <div className="form-grid">
        <Field label={t.name}>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label={t.brand}>
          <TextInput value={brand} onChange={(e) => setBrand(e.target.value)} />
        </Field>
        <Field label={t.limit}>
          <TextInput
            type="number"
            step="0.01"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
          />
        </Field>
        <Field label={t.closingDay}>
          <TextInput
            type="number"
            min="1"
            max="28"
            value={closingDay}
            onChange={(e) => setClosingDay(e.target.value)}
          />
        </Field>
        <Field label={t.dueDay}>
          <TextInput
            type="number"
            min="1"
            max="28"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
          />
        </Field>
        <div className="form-grid__actions">
          <Button variant="ghost" onClick={onClose}>
            {strings.common.cancel}
          </Button>
          <Button
            onClick={() => save.mutate()}
            disabled={!name.trim() || save.isPending}
          >
            {strings.common.save}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function PurchaseModal({
  contextId,
  cards,
  onClose,
  onSaved,
}: {
  contextId: string
  cards: CreditCard[]
  onClose: () => void
  onSaved: () => void
}) {
  const [cardId, setCardId] = useState(cards[0]?.id ?? '')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [occurredAt, setOccurredAt] = useState(today())
  const [categoryId, setCategoryId] = useState('')
  const [installments, setInstallments] = useState('1')

  const categories = useQuery({
    queryKey: ['categories', contextId, 'expense'],
    queryFn: () => categoriesApi.listCategories(contextId, { type: 'expense' }),
  })

  const save = useMutation({
    mutationFn: () =>
      creditCardsApi.createCardPurchase(contextId, cardId, {
        description,
        amount: Number(amount),
        occurred_at: occurredAt,
        category_id: categoryId || null,
        installments: Number(installments),
      }),
    onSuccess: () => {
      toastSuccess(t.purchaseSaved)
      onSaved()
    },
    onError: (error) => toastError(getErrorMessage(error)),
  })

  return (
    <Modal title={t.newPurchase} onClose={onClose}>
      <div className="form-grid">
        <Field label={t.title}>
          <TextSelect value={cardId} onChange={(e) => setCardId(e.target.value)}>
            {cards.map((card) => (
              <option key={card.id} value={card.id}>
                {card.name}
              </option>
            ))}
          </TextSelect>
        </Field>
        <Field label={strings.quickAdd.description}>
          <TextInput
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={150}
          />
        </Field>
        <Field label={strings.quickAdd.amount}>
          <TextInput
            type="number"
            step="0.01"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <Field label={t.purchaseDate}>
          <TextInput
            type="date"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
          />
        </Field>
        <Field label={strings.quickAdd.category}>
          <TextSelect
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">{strings.quickAdd.noCategory}</option>
            {(categories.data ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </TextSelect>
        </Field>
        <Field label={t.installments}>
          <TextInput
            type="number"
            min="1"
            max="48"
            value={installments}
            onChange={(e) => setInstallments(e.target.value)}
          />
        </Field>
        <div className="form-grid__actions">
          <Button variant="ghost" onClick={onClose}>
            {strings.common.cancel}
          </Button>
          <Button
            onClick={() => save.mutate()}
            disabled={
              !cardId || !description.trim() || Number(amount) <= 0 || save.isPending
            }
          >
            {strings.common.save}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function PayModal({
  contextId,
  invoiceId,
  cardId,
  onClose,
  onPaid,
}: {
  contextId: string
  invoiceId: string
  cardId: string
  onClose: () => void
  onPaid: () => void
}) {
  const [accountId, setAccountId] = useState('')
  const [occurredAt, setOccurredAt] = useState(today())

  const accounts = useQuery({
    queryKey: ['accounts', contextId],
    queryFn: () => accountsApi.listAccounts(contextId),
  })

  const pay = useMutation({
    mutationFn: () =>
      creditCardsApi.payCardInvoice(
        contextId,
        cardId,
        invoiceId,
        accountId,
        occurredAt,
      ),
    onSuccess: () => {
      toastSuccess(t.paidToast)
      onPaid()
    },
    onError: (error) => toastError(getErrorMessage(error)),
  })

  return (
    <Modal title={t.payInvoice} onClose={onClose}>
      <div className="form-grid">
        <Field label={t.payFrom}>
          <TextSelect
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            <option value="">{strings.common.select}</option>
            {(accounts.data ?? []).map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </TextSelect>
        </Field>
        <Field label={strings.quickAdd.date}>
          <TextInput
            type="date"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
          />
        </Field>
        <div className="form-grid__actions">
          <Button variant="ghost" onClick={onClose}>
            {strings.common.cancel}
          </Button>
          <Button
            onClick={() => pay.mutate()}
            disabled={!accountId || pay.isPending}
          >
            {t.pay}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
