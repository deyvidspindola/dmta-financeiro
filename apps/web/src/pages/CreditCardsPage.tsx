import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { creditCardsApi } from '@/api'
import { strings } from '@/i18n/pt-BR'
import { formatDate, formatMoney } from '@/lib/format'
import { useWritableContextId } from '@/hooks/useWritableContextId'
import { CONSOLIDATED, useAuthStore } from '@/store/authStore'
import {
  Button,
  DataTable,
  EmptyState,
  ErrorBanner,
  Field,
  LoadingBlock,
  Modal,
  PageHeader,
  TextInput,
} from '@/components/ui'

const schema = z.object({
  name: z.string().min(1, strings.common.required),
  brand: z.string().optional(),
  limit: z.coerce.number().positive(),
  closing_day: z.coerce.number().int().min(1).max(31),
  due_day: z.coerce.number().int().min(1).max(31),
})

type FormValues = z.infer<typeof schema>

export function CreditCardsPage() {
  const queryClient = useQueryClient()
  const activeScope = useAuthStore((s) => s.activeScope)
  const contextId = useWritableContextId()
  const [open, setOpen] = useState(false)
  const listContextId = activeScope === CONSOLIDATED ? null : activeScope

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

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      brand: '',
      limit: 0,
      closing_day: 5,
      due_day: 12,
    },
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      creditCardsApi.createCreditCard(contextId!, {
        name: values.name,
        brand: values.brand || null,
        limit: values.limit,
        closing_day: values.closing_day,
        due_day: values.due_day,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['credit-cards'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setOpen(false)
      form.reset()
    },
  })

  const cards = cardsQuery.data ?? []
  const invoices = invoicesQuery.data ?? []

  return (
    <div className="stack">
      <PageHeader
        title={strings.creditCards.title}
        actions={
          <Button
            onClick={() => setOpen(true)}
            disabled={!contextId || activeScope === CONSOLIDATED}
          >
            {strings.creditCards.create}
          </Button>
        }
      />

      {activeScope === CONSOLIDATED ? (
        <ErrorBanner message="Selecione um contexto para cadastrar e listar cartões." />
      ) : null}

      {cardsQuery.isLoading ? (
        <LoadingBlock label={strings.common.loading} />
      ) : null}
      {cardsQuery.isError ? (
        <ErrorBanner message={strings.common.error} />
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
          ]}
        >
          {cards.map((card) => (
            <tr key={card.id}>
              <td>{card.name}</td>
              <td>{card.brand ?? '—'}</td>
              <td className="mono">{formatMoney(card.limit)}</td>
              <td>{card.closing_day}</td>
              <td>{card.due_day}</td>
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
          title={strings.creditCards.create}
          onClose={() => setOpen(false)}
        >
          <form
            className="form-grid"
            onSubmit={form.handleSubmit((values) =>
              mutation.mutateAsync(values),
            )}
          >
            <Field
              label={strings.creditCards.name}
              error={form.formState.errors.name?.message}
            >
              <TextInput {...form.register('name')} />
            </Field>
            <Field label={strings.creditCards.brand}>
              <TextInput {...form.register('brand')} />
            </Field>
            <Field
              label={strings.creditCards.limit}
              error={form.formState.errors.limit?.message}
            >
              <TextInput type="number" step="0.01" {...form.register('limit')} />
            </Field>
            <Field
              label={strings.creditCards.closingDay}
              error={form.formState.errors.closing_day?.message}
            >
              <TextInput type="number" {...form.register('closing_day')} />
            </Field>
            <Field
              label={strings.creditCards.dueDay}
              error={form.formState.errors.due_day?.message}
            >
              <TextInput type="number" {...form.register('due_day')} />
            </Field>
            <div className="form-actions">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                {strings.common.cancel}
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {strings.common.save}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  )
}
