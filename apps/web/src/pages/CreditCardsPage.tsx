import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2 } from 'lucide-react'
import { z } from 'zod'
import { creditCardsApi } from '@/api'
import { strings } from '@/i18n/pt-BR'
import { formatDate, formatMoney } from '@/lib/format'
import { getErrorMessage } from '@/lib/errors'
import { useWritableContextId } from '@/hooks/useWritableContextId'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'
import { toastError, toastSuccess } from '@/store/toastStore'
import {
  Button,
  DataTable,
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
import type { CreditCard } from '@/types/models'

const cardSchema = z.object({
  name: z.string().min(1, strings.common.required),
  brand: z.string().optional(),
  limit: z.coerce.number().positive(),
  closing_day: z.coerce.number().int().min(1).max(31),
  due_day: z.coerce.number().int().min(1).max(31),
})

const invoiceSchema = z.object({
  credit_card_id: z.string().min(1, strings.common.required),
  reference_month: z.string().min(1, strings.common.required),
  amount: z.coerce.number().nonnegative(),
  due_date: z.string().min(1, strings.common.required),
})

type CardFormValues = z.infer<typeof cardSchema>
type InvoiceFormValues = z.infer<typeof invoiceSchema>

const emptyCardValues: CardFormValues = {
  name: '',
  brand: '',
  limit: 0,
  closing_day: 5,
  due_day: 12,
}

export function CreditCardsPage() {
  const queryClient = useQueryClient()
  const activeScope = useAuthStore((s) => s.activeScope)
  const contextId = useWritableContextId()
  const [editing, setEditing] = useState<CreditCard | null>(null)
  const [open, setOpen] = useState(false)
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const listContextId = activeScope === CONSOLIDATED ? null : activeScope
  const isEdit = editing !== null

  const cardsQuery = useQuery({
    queryKey: ['credit-cards', listContextId],
    queryFn: () => creditCardsApi.listCreditCards(listContextId!),
    enabled: Boolean(listContextId),
  })

  const invoicesQuery = useQuery({
    queryKey: ['card-invoices', listContextId],
    queryFn: () => creditCardsApi.listCardInvoices(listContextId!),
    enabled: Boolean(listContextId),
  })

  const cardForm = useForm<CardFormValues>({
    resolver: zodResolver(cardSchema),
    defaultValues: emptyCardValues,
  })

  function openCreate() {
    setEditing(null)
    cardForm.reset(emptyCardValues)
    setOpen(true)
  }

  function openEdit(card: CreditCard) {
    setEditing(card)
    cardForm.reset({
      name: card.name,
      brand: card.brand ?? '',
      limit: card.limit,
      closing_day: card.closing_day,
      due_day: card.due_day,
    })
    setOpen(true)
  }

  function closeCardModal() {
    setOpen(false)
    setEditing(null)
    cardForm.reset(emptyCardValues)
  }

  const invoiceForm = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      credit_card_id: '',
      reference_month: new Date().toISOString().slice(0, 7),
      amount: 0,
      due_date: '',
    },
  })

  const cardMutation = useMutation({
    mutationFn: (values: CardFormValues) => {
      const payload = {
        name: values.name,
        brand: values.brand || null,
        limit: values.limit,
        closing_day: values.closing_day,
        due_day: values.due_day,
      }
      if (isEdit && editing) {
        return creditCardsApi.updateCreditCard(contextId!, editing.id, payload)
      }
      return creditCardsApi.createCreditCard(contextId!, payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['credit-cards'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toastSuccess(
        isEdit ? strings.creditCards.updated : strings.creditCards.created,
      )
      closeCardModal()
    },
  })

  const invoiceMutation = useMutation({
    mutationFn: (values: InvoiceFormValues) =>
      creditCardsApi.createCardInvoice(contextId!, values.credit_card_id, {
        reference_month: values.reference_month,
        amount: values.amount,
        due_date: values.due_date,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['card-invoices'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toastSuccess(strings.creditCards.invoiceCreated)
      setInvoiceOpen(false)
      invoiceForm.reset({
        credit_card_id: '',
        reference_month: new Date().toISOString().slice(0, 7),
        amount: 0,
        due_date: '',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (creditCardId: string) =>
      creditCardsApi.deleteCreditCard(contextId!, creditCardId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['credit-cards'] })
      await queryClient.invalidateQueries({ queryKey: ['card-invoices'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toastSuccess(strings.creditCards.deleted)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  function handleDelete(creditCardId: string) {
    if (!window.confirm(strings.creditCards.confirmDelete)) return
    deleteMutation.mutate(creditCardId)
  }

  const cards = cardsQuery.data ?? []
  const invoices = invoicesQuery.data ?? []

  return (
    <div className="stack">
      <PageHeader
        title={strings.creditCards.title}
        actions={
          <>
            <Button
              variant="ghost"
              onClick={() => setInvoiceOpen(true)}
              disabled={!contextId || activeScope === CONSOLIDATED || cards.length === 0}
            >
              Nova fatura
            </Button>
            <Button
              onClick={openCreate}
              disabled={!contextId || activeScope === CONSOLIDATED}
            >
              {strings.creditCards.create}
            </Button>
          </>
        }
      />

      {activeScope === CONSOLIDATED ? (
        <ErrorBanner message="Selecione um contexto para cadastrar e listar cartões." />
      ) : null}

      {cardsQuery.isLoading ? (
        <LoadingBlock label={strings.common.loading} />
      ) : null}
      {cardsQuery.isError ? (
        <ErrorBanner message={getErrorMessage(cardsQuery.error)} />
      ) : null}

      {!cardsQuery.isLoading && listContextId && cards.length === 0 ? (
        <EmptyState message={strings.creditCards.empty} />
      ) : null}

      {cards.length > 0 ? (
        <DataTable
          headers={[
            strings.creditCards.name,
            strings.creditCards.brand,
            strings.creditCards.limit,
            strings.creditCards.closingDay,
            strings.creditCards.dueDay,
            strings.common.actions,
          ]}
        >
          {cards.map((card) => (
            <tr key={card.id}>
              <td>{card.name}</td>
              <td>{card.brand ?? '—'}</td>
              <td className="mono">{formatMoney(card.limit)}</td>
              <td>{card.closing_day}</td>
              <td>{card.due_day}</td>
              <td className="actions-cell">
                <IconButton
                  label={strings.common.edit}
                  icon={Pencil}
                  onClick={() => openEdit(card)}
                  disabled={!contextId}
                />
                <IconButton
                  label={strings.common.delete}
                  icon={Trash2}
                  variant="danger"
                  onClick={() => handleDelete(card.id)}
                  disabled={deleteMutation.isPending || !contextId}
                />
              </td>
            </tr>
          ))}
        </DataTable>
      ) : null}

      {invoices.length > 0 ? (
        <>
          <h2 className="section-title">{strings.creditCards.invoices}</h2>
          <DataTable
            headers={[
              strings.creditCards.name,
              'Referência',
              strings.bills.amount,
              strings.bills.dueDate,
              strings.bills.status,
            ]}
          >
            {invoices.map((invoice) => {
              const card = cards.find((c) => c.id === invoice.credit_card_id)
              return (
                <tr key={invoice.id}>
                  <td>{card?.name ?? invoice.credit_card_id}</td>
                  <td>{invoice.reference_month}</td>
                  <td className="mono">{formatMoney(invoice.amount)}</td>
                  <td>{formatDate(invoice.due_date)}</td>
                  <td>{invoice.status}</td>
                </tr>
              )
            })}
          </DataTable>
        </>
      ) : null}

      {open && contextId ? (
        <Modal
          title={
            isEdit ? strings.creditCards.edit : strings.creditCards.create
          }
          onClose={closeCardModal}
        >
          <form
            className="form-grid"
            onSubmit={cardForm.handleSubmit((values) =>
              cardMutation.mutateAsync(values),
            )}
          >
            <Field
              label={strings.creditCards.name}
              error={cardForm.formState.errors.name?.message}
            >
              <TextInput {...cardForm.register('name')} />
            </Field>
            <Field label={strings.creditCards.brand}>
              <TextInput {...cardForm.register('brand')} />
            </Field>
            <Field
              label={strings.creditCards.limit}
              error={cardForm.formState.errors.limit?.message}
            >
              <TextInput type="number" step="0.01" {...cardForm.register('limit')} />
            </Field>
            <Field
              label={strings.creditCards.closingDay}
              error={cardForm.formState.errors.closing_day?.message}
            >
              <TextInput type="number" {...cardForm.register('closing_day')} />
            </Field>
            <Field
              label={strings.creditCards.dueDay}
              error={cardForm.formState.errors.due_day?.message}
            >
              <TextInput type="number" {...cardForm.register('due_day')} />
            </Field>
            {cardMutation.isError ? (
              <ErrorBanner message={getErrorMessage(cardMutation.error)} />
            ) : null}
            <div className="form-actions">
              <Button type="button" variant="ghost" onClick={closeCardModal}>
                {strings.common.cancel}
              </Button>
              <Button type="submit" disabled={cardMutation.isPending}>
                {strings.common.save}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {invoiceOpen && contextId ? (
        <Modal title="Nova fatura" onClose={() => setInvoiceOpen(false)}>
          <form
            className="form-grid"
            onSubmit={invoiceForm.handleSubmit((values) =>
              invoiceMutation.mutateAsync(values),
            )}
          >
            <Field
              label={strings.creditCards.name}
              error={invoiceForm.formState.errors.credit_card_id?.message}
            >
              <TextSelect {...invoiceForm.register('credit_card_id')}>
                <option value="">{strings.common.select}</option>
                {cards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.name}
                  </option>
                ))}
              </TextSelect>
            </Field>
            <Field
              label="Referência (mês)"
              error={invoiceForm.formState.errors.reference_month?.message}
            >
              <TextInput
                type="month"
                {...invoiceForm.register('reference_month')}
              />
            </Field>
            <Field
              label={strings.bills.amount}
              error={invoiceForm.formState.errors.amount?.message}
            >
              <TextInput
                type="number"
                step="0.01"
                {...invoiceForm.register('amount')}
              />
            </Field>
            <Field
              label={strings.bills.dueDate}
              error={invoiceForm.formState.errors.due_date?.message}
            >
              <TextInput type="date" {...invoiceForm.register('due_date')} />
            </Field>
            {invoiceMutation.isError ? (
              <ErrorBanner message={getErrorMessage(invoiceMutation.error)} />
            ) : null}
            <div className="form-actions">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setInvoiceOpen(false)}
              >
                {strings.common.cancel}
              </Button>
              <Button type="submit" disabled={invoiceMutation.isPending}>
                {strings.common.save}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  )
}
