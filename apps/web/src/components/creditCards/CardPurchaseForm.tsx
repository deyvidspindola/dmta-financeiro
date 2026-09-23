import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { categoriesApi, creditCardsApi } from '@/api'
import { CategoryModal } from '@/components/CategoryModal'
import {
  Button,
  CategorySelect,
  DatePickerField,
  Field,
  MoneyInput,
  SwitchField,
  TextInput,
  TextSelect,
} from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { currentMonthKey } from '@/lib/dates'
import { toIsoDate } from '@/lib/datesIso'
import { getErrorMessage } from '@/lib/errors'
import { toastError, toastSuccess } from '@/store/toastStore'
import type {
  CardPurchase,
  CreditCard,
  RecurrenceInterval,
} from '@/types/models'

const t = strings.creditCards

function today(): string {
  return `${currentMonthKey()}-${String(new Date().getDate()).padStart(2, '0')}`
}

export type CardPurchaseFormProps = {
  contextId: string
  cards: CreditCard[]
  defaultCardId?: string
  editing?: CardPurchase | null
  onCancel: () => void
  onSaved: () => void
}

/**
 * Formulário de compra no cartão (criar / editar). Categoria de despesa
 * com atalho pra CategoryModal — mesmo padrão do TransactionForm.
 * Em edição não mostra parcelas (backend bloqueia compra parcelada).
 * "Compra recorrente" (só ao criar) vira assinatura: o backend relança a
 * compra no cartão a cada período — não combina com parcelas.
 */
export function CardPurchaseForm({
  contextId,
  cards,
  defaultCardId,
  editing = null,
  onCancel,
  onSaved,
}: CardPurchaseFormProps) {
  const isEdit = editing !== null
  const queryClient = useQueryClient()
  const [categoryOpen, setCategoryOpen] = useState(false)

  const [cardId, setCardId] = useState(
    editing?.credit_card_id ?? defaultCardId ?? cards[0]?.id ?? '',
  )
  const [description, setDescription] = useState(editing?.description ?? '')
  const [amount, setAmount] = useState(editing?.amount ?? 0)
  const [occurredAt, setOccurredAt] = useState(
    editing ? toIsoDate(editing.occurred_at) : today(),
  )
  const [categoryId, setCategoryId] = useState(editing?.category_id ?? '')
  const [installments, setInstallments] = useState('1')
  const [recurring, setRecurring] = useState(false)
  const [frequency, setFrequency] = useState<RecurrenceInterval>('monthly')
  const [endDate, setEndDate] = useState('')

  const categories = useQuery({
    queryKey: ['categories', contextId, 'expense'],
    queryFn: () => categoriesApi.listCategories(contextId, { type: 'expense' }),
  })

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        description: description.trim(),
        amount,
        occurred_at: occurredAt,
        category_id: categoryId || null,
      }
      if (isEdit && editing) {
        await creditCardsApi.updateCardPurchase(
          contextId,
          editing.credit_card_id,
          editing.id,
          payload,
        )
        return
      }
      await creditCardsApi.createCardPurchase(contextId, cardId, {
        ...payload,
        ...(recurring
          ? { recurring: true, interval: frequency, end_date: endDate || null }
          : { installments: Number(installments) }),
      })
    },
    onSuccess: () => {
      toastSuccess(
        isEdit
          ? t.purchaseUpdated
          : recurring
            ? t.subscriptionSaved
            : t.purchaseSaved,
      )
      void queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] })
      void queryClient.invalidateQueries({ queryKey: ['categories', contextId] })
      void queryClient.invalidateQueries({ queryKey: ['budgets'] })
      onSaved()
    },
    onError: (error) => toastError(getErrorMessage(error)),
  })

  const canSubmit =
    Boolean(cardId) &&
    description.trim().length > 0 &&
    amount > 0 &&
    Boolean(occurredAt) &&
    !save.isPending

  return (
    <>
      <div className="grid gap-4">
        {!isEdit && cards.length > 1 ? (
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

        <Field label={strings.quickAdd.description} required>
          <TextInput
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={150}
            autoFocus
          />
        </Field>

        <Field label={strings.quickAdd.amount} required>
          <MoneyInput value={amount} onChange={setAmount} />
        </Field>

        <Field label={t.purchaseDate} required>
          <DatePickerField
            key={editing?.id ?? 'new'}
            value={occurredAt}
            onChange={setOccurredAt}
          />
        </Field>

        <CategorySelect
          label={strings.quickAdd.category}
          categories={categories.data ?? []}
          value={categoryId || null}
          onChange={(value) => setCategoryId(value || '')}
          placeholder={strings.quickAdd.noCategory}
          onQuickAdd={() => setCategoryOpen(true)}
          quickAddLabel={strings.categories.quickAdd}
        />

        {!isEdit ? (
          <SwitchField
            label={t.subscription}
            description={t.subscriptionHint}
            checked={recurring}
            onChange={setRecurring}
          />
        ) : null}

        {!isEdit && recurring ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.subscriptionInterval}>
              <TextSelect
                value={frequency}
                onChange={(e) =>
                  setFrequency(e.target.value as RecurrenceInterval)
                }
              >
                {(['monthly', 'weekly', 'yearly'] as const).map((value) => (
                  <option key={value} value={value}>
                    {strings.recurring.intervals[value]}
                  </option>
                ))}
              </TextSelect>
            </Field>
            <Field label={t.subscriptionEnd}>
              <DatePickerField value={endDate} onChange={setEndDate} />
            </Field>
          </div>
        ) : null}

        {!isEdit && !recurring ? (
          <Field label={t.installments}>
            <TextInput
              type="number"
              min="1"
              max="48"
              value={installments}
              onChange={(e) => setInstallments(e.target.value)}
            />
          </Field>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onCancel} disabled={save.isPending}>
            {strings.common.cancel}
          </Button>
          <Button
            onClick={() => save.mutate()}
            disabled={!canSubmit}
            loading={save.isPending}
          >
            {strings.common.save}
          </Button>
        </div>
      </div>

      <CategoryModal
        contextId={contextId}
        open={categoryOpen}
        onClose={() => setCategoryOpen(false)}
        defaultType="expense"
        onCreated={(id) => {
          setCategoryId(id)
          void queryClient.invalidateQueries({
            queryKey: ['categories', contextId, 'expense'],
          })
        }}
      />
    </>
  )
}
