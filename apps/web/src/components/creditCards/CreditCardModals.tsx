import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { accountsApi, categoriesApi, creditCardsApi } from '@/api'
import {
  Button,
  Field,
  Modal,
  TextInput,
  TextSelect,
} from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { currentMonthKey } from '@/lib/dates'
import { getErrorMessage } from '@/lib/errors'
import { toastError, toastSuccess } from '@/store/toastStore'
import type { CreditCard } from '@/types/models'

const t = strings.creditCards

function today(): string {
  return `${currentMonthKey()}-${String(new Date().getDate()).padStart(2, '0')}`
}

export function CardFormModal({
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
      <div className="grid gap-4">
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
        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            {strings.common.cancel}
          </Button>
          <Button
            onClick={() => save.mutate()}
            disabled={!name.trim() || save.isPending}
            loading={save.isPending}
          >
            {strings.common.save}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export function PurchaseModal({
  contextId,
  cards,
  defaultCardId,
  onClose,
  onSaved,
}: {
  contextId: string
  cards: CreditCard[]
  defaultCardId?: string
  onClose: () => void
  onSaved: () => void
}) {
  const [cardId, setCardId] = useState(defaultCardId ?? cards[0]?.id ?? '')
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
      <div className="grid gap-4">
        {cards.length > 1 ? (
          <Field label={t.title}>
            <TextSelect value={cardId} onChange={(e) => setCardId(e.target.value)}>
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name}
                </option>
              ))}
            </TextSelect>
          </Field>
        ) : null}
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
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            {strings.common.cancel}
          </Button>
          <Button
            onClick={() => save.mutate()}
            disabled={
              !cardId || !description.trim() || Number(amount) <= 0 || save.isPending
            }
            loading={save.isPending}
          >
            {strings.common.save}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export function PayModal({
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
      <div className="grid gap-4">
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
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            {strings.common.cancel}
          </Button>
          <Button
            onClick={() => pay.mutate()}
            disabled={!accountId || pay.isPending}
            loading={pay.isPending}
          >
            {t.pay}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
