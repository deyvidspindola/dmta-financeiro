import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { recurringTransactionsApi, transactionsApi } from '@/api'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { emptyEntry } from '@/components/transactions/schemas'
import type { EntryFormValues } from '@/components/transactions/schemas'
import { PageHeader } from '@/components/ui'
import { useWritableContextId } from '@/hooks/useWritableContextId'
import { strings } from '@/i18n/pt-BR'
import { currentMonthKey } from '@/lib/dates'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/cn'
import { toastError, toastSuccess } from '@/store/toastStore'
import type { MoneyDirection } from '@/types/models'

function today(): string {
  return `${currentMonthKey()}-${String(new Date().getDate()).padStart(2, '0')}`
}

const t = strings.quickAdd

export function QuickAddPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const contextId = useWritableContextId()
  const [type, setType] = useState<MoneyDirection>('expense')

  const create = useMutation({
    mutationFn: async (values: EntryFormValues) => {
      const payload = {
        account_id: values.account_id,
        category_id: values.category_id || null,
        description: values.description,
        amount: values.amount,
        type: values.type,
        date: values.date,
        goal_id:
          values.type === 'income' ? values.goal_id || null : null,
        settled: values.settled,
      }
      if (values.is_recurring) {
        await recurringTransactionsApi.createRecurringTransaction(contextId!, {
          account_id: values.account_id,
          category_id: values.category_id || null,
          description: values.description,
          amount: values.amount,
          type: values.type,
          interval: values.interval,
          start_date: values.start_date || values.date,
          end_date: values.end_date || null,
        })
        return
      }
      await transactionsApi.createTransaction(contextId!, payload)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] })
      void queryClient.invalidateQueries({ queryKey: ['accounts'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toastSuccess(t.saved)
      navigate('/transactions')
    },
    onError: (error) => toastError(getErrorMessage(error)),
  })

  if (!contextId) {
    return (
      <div className="space-y-4 bg-canvas text-fg">
        <PageHeader title={t.title} />
        <p className="text-sm text-fg-muted">{t.pickContext}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-6 bg-canvas text-fg">
      <PageHeader title={t.title} />

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setType('expense')}
          className={cn(
            'flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
            type === 'expense'
              ? 'border-negative bg-negative/10 text-negative'
              : 'border-line bg-surface text-fg-muted hover:bg-surface-2',
          )}
        >
          <ArrowDownCircle size={18} aria-hidden />
          {t.expense}
        </button>
        <button
          type="button"
          onClick={() => setType('income')}
          className={cn(
            'flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
            type === 'income'
              ? 'border-positive bg-positive/10 text-positive'
              : 'border-line bg-surface text-fg-muted hover:bg-surface-2',
          )}
        >
          <ArrowUpCircle size={18} aria-hidden />
          {t.income}
        </button>
      </div>

      <TransactionForm
        key={type}
        contextId={contextId}
        initialValues={{ ...emptyEntry(today()), type }}
        showRecurring={false}
        showGoal={false}
        variant="quick"
        isPending={create.isPending}
        error={create.isError ? getErrorMessage(create.error) : null}
        onSubmit={(values) => create.mutate(values)}
        onCancel={() => void navigate(-1)}
      />
    </div>
  )
}
