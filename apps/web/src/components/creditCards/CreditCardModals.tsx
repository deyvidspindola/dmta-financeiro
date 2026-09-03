import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { accountsApi, creditCardsApi } from '@/api'
import { ApiError } from '@/api/http'
import { CardPurchaseForm } from '@/components/creditCards/CardPurchaseForm'
import {
  Button,
  DatePickerField,
  Field,
  Modal,
  MoneyInput,
  TextInput,
  TextSelect,
  useConfirm,
} from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { currentMonthKey } from '@/lib/dates'
import { getErrorMessage } from '@/lib/errors'
import { toastError, toastSuccess } from '@/store/toastStore'
import type { CardPurchase, CreditCard } from '@/types/models'

const t = strings.creditCards

function today(): string {
  return `${currentMonthKey()}-${String(new Date().getDate()).padStart(2, '0')}`
}

export function CardFormModal({
  contextId,
  editing,
  onClose,
  onSaved,
  onDeleted,
}: {
  contextId: string
  editing: CreditCard | null
  onClose: () => void
  onSaved: () => void
  onDeleted?: () => void
}) {
  const confirm = useConfirm()
  const [name, setName] = useState(editing?.name ?? '')
  const [brand, setBrand] = useState(editing?.brand ?? '')
  const [limit, setLimit] = useState(editing?.limit ?? 0)
  const [closingDay, setClosingDay] = useState(String(editing?.closing_day ?? 5))
  const [dueDay, setDueDay] = useState(String(editing?.due_day ?? 12))

  const remove = useMutation({
    mutationFn: (force: boolean) =>
      creditCardsApi.deleteCreditCard(contextId, editing!.id, force),
    onSuccess: () => {
      toastSuccess(t.deleted)
      onDeleted?.()
    },
    onError: (error) => toastError(getErrorMessage(error)),
  })

  async function handleDelete() {
    if (!editing) return
    if (!(await confirm({ message: t.confirmDelete, tone: 'danger', confirmLabel: t.delete }))) {
      return
    }
    try {
      await remove.mutateAsync(false)
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 422) return
      if (await confirm({ message: t.confirmDeletePaid, tone: 'danger', confirmLabel: t.delete })) {
        remove.mutate(true)
      }
    }
  }

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        name,
        brand: brand || null,
        limit,
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
          <MoneyInput value={limit} onChange={setLimit} />
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
        <div className="flex items-center justify-between gap-2 pt-2">
          {editing && onDeleted ? (
            <Button
              variant="ghost"
              className="text-negative hover:text-negative"
              onClick={handleDelete}
              disabled={remove.isPending}
              loading={remove.isPending}
            >
              {t.delete}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
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
      </div>
    </Modal>
  )
}

export function PurchaseModal({
  contextId,
  cards,
  defaultCardId,
  editing = null,
  onClose,
  onSaved,
}: {
  contextId: string
  cards: CreditCard[]
  defaultCardId?: string
  editing?: CardPurchase | null
  onClose: () => void
  onSaved: () => void
}) {
  return (
    <Modal title={editing ? t.editPurchase : t.newPurchase} onClose={onClose}>
      <CardPurchaseForm
        contextId={contextId}
        cards={cards}
        defaultCardId={defaultCardId}
        editing={editing}
        onCancel={onClose}
        onSaved={onSaved}
      />
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
          <DatePickerField value={occurredAt} onChange={setOccurredAt} />
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
