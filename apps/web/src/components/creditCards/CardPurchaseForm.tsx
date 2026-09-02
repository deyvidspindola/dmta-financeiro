import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { categoriesApi, creditCardsApi } from '@/api'
import { CategoryModal } from '@/components/CategoryModal'
import {
  Button,
  DatePickerField,
  Field,
  MoneyInput,
  TextInput,
  TextSelect,
} from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { currentMonthKey } from '@/lib/dates'
import { toIsoDate } from '@/lib/datesIso'
import { getErrorMessage } from '@/lib/errors'
import { toastError, toastSuccess } from '@/store/toastStore'
import type { CardPurchase, CreditCard } from '@/types/models'

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
        installments: Number(installments),
      })
    },
    onSuccess: () => {
      toastSuccess(isEdit ? t.purchaseUpdated : t.purchaseSaved)
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

        <Field label={strings.quickAdd.category}>
          <div className="flex gap-2">
            <TextSelect
              className="min-w-0 flex-1"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">{strings.quickAdd.noCategory}</option>
              {(categories.data ?? []).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.parent_id ? `↳ ${category.name}` : category.name}
                </option>
              ))}
            </TextSelect>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCategoryOpen(true)}
            >
              {strings.categories.quickAdd}
            </Button>
          </div>
        </Field>

        {!isEdit ? (
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
