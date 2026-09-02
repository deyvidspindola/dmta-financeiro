import { useState } from 'react'
import {
  Button,
  DatePickerField,
  ErrorBanner,
  Field,
  TextSelect,
} from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { formatDate } from '@/lib/format'
import type { Account, Bill } from '@/types/models'

const b = strings.bills

type PayBillFormProps = {
  bill: Bill
  accounts: Account[]
  isPending?: boolean
  error?: string | null
  onSubmit: (values: { account_id: string; occurred_at: string | null }) => void
  onCancel: () => void
}

export function PayBillForm({
  bill,
  accounts,
  isPending,
  error,
  onSubmit,
  onCancel,
}: PayBillFormProps) {
  const [accountId, setAccountId] = useState('')
  const [payDate, setPayDate] = useState('')

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (!accountId) return
        onSubmit({
          account_id: accountId,
          occurred_at: payDate || null,
        })
      }}
    >
      <p className="text-sm text-fg-muted">
        {bill.description} · {formatDate(bill.due_date)}
      </p>
      <Field label={b.payAccount}>
        <TextSelect
          value={accountId}
          onChange={(event) => setAccountId(event.target.value)}
          required
        >
          <option value="">{strings.common.select}</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </TextSelect>
      </Field>
      <Field label={b.payDate}>
        <DatePickerField
          key={bill.id}
          value={payDate}
          onChange={setPayDate}
        />
      </Field>
      {error ? <ErrorBanner message={error} /> : null}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {strings.common.cancel}
        </Button>
        <Button type="submit" disabled={isPending || !accountId}>
          {b.pay}
        </Button>
      </div>
    </form>
  )
}
