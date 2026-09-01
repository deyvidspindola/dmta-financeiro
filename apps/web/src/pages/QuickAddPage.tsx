import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { accountsApi, categoriesApi, transactionsApi } from '@/api'
import {
  Button,
  Field,
  PageHeader,
  TextInput,
  TextSelect,
} from '@/components/ui-legacy'
import { useWritableContextId } from '@/hooks/useWritableContextId'
import { strings } from '@/i18n/pt-BR'
import { currentMonthKey } from '@/lib/dates'
import { getErrorMessage } from '@/lib/errors'
import { toastError, toastSuccess } from '@/store/toastStore'
import type { MoneyDirection } from '@/types/models'

function today(): string {
  return `${currentMonthKey()}-${String(new Date().getDate()).padStart(2, '0')}`
}

export function QuickAddPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const contextId = useWritableContextId()

  const [type, setType] = useState<MoneyDirection>('expense')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(today())

  const accounts = useQuery({
    queryKey: ['accounts', contextId],
    queryFn: () => accountsApi.listAccounts(contextId as string),
    enabled: Boolean(contextId),
  })
  const categories = useQuery({
    queryKey: ['categories', contextId, type],
    queryFn: () => categoriesApi.listCategories(contextId as string, { type }),
    enabled: Boolean(contextId),
  })

  const create = useMutation({
    mutationFn: () =>
      transactionsApi.createTransaction(contextId as string, {
        account_id: accountId,
        category_id: categoryId || null,
        description,
        amount: Number(amount),
        type,
        date,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] })
      void queryClient.invalidateQueries({ queryKey: ['accounts'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toastSuccess(strings.quickAdd.saved)
      navigate('/transactions')
    },
    onError: (error) => toastError(getErrorMessage(error)),
  })

  if (!contextId) {
    return (
      <div className="page">
        <PageHeader title={strings.quickAdd.title} />
        <p className="muted">{strings.quickAdd.pickContext}</p>
      </div>
    )
  }

  const canSubmit = description.trim() && Number(amount) > 0 && accountId

  return (
    <div className="page page--narrow">
      <PageHeader title={strings.quickAdd.title} />

      <div className="quick-type">
        <button
          type="button"
          className={`quick-type__btn${type === 'expense' ? ' is-active is-expense' : ''}`}
          onClick={() => setType('expense')}
        >
          <ArrowDownCircle size={18} /> {strings.quickAdd.expense}
        </button>
        <button
          type="button"
          className={`quick-type__btn${type === 'income' ? ' is-active is-income' : ''}`}
          onClick={() => setType('income')}
        >
          <ArrowUpCircle size={18} /> {strings.quickAdd.income}
        </button>
      </div>

      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault()
          create.mutate()
        }}
      >
        <Field label={strings.quickAdd.amount}>
          <TextInput
            type="number"
            step="0.01"
            min="0.01"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            autoFocus
          />
        </Field>
        <Field label={strings.quickAdd.description}>
          <TextInput
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={150}
          />
        </Field>
        <Field label={strings.quickAdd.account}>
          <TextSelect
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
          >
            <option value="">—</option>
            {(accounts.data ?? []).map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </TextSelect>
        </Field>
        <Field label={strings.quickAdd.category}>
          <TextSelect
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="">{strings.quickAdd.noCategory}</option>
            {(categories.data ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </TextSelect>
        </Field>
        <Field label={strings.quickAdd.date}>
          <TextInput
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </Field>
        <div className="form-grid__actions">
          <Button variant="ghost" onClick={() => void navigate(-1)}>
            {strings.common.cancel}
          </Button>
          <Button
            onClick={() => create.mutate()}
            disabled={!canSubmit || create.isPending}
          >
            {create.isPending ? strings.common.loading : strings.common.save}
          </Button>
        </div>
      </form>
    </div>
  )
}
