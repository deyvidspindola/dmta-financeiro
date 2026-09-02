import {
  Button,
  Field,
  TextSelect,
} from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import type { Account } from '@/types/models'

const t = strings.debts

type SettleDebtFormProps = {
  accounts: Account[]
  isPending?: boolean
  onSubmit: (accountId: string | null) => void
  onCancel: () => void
}

export function SettleDebtForm({
  accounts,
  isPending,
  onSubmit,
  onCancel,
}: SettleDebtFormProps) {
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        const form = event.currentTarget
        const accountId =
          (form.elements.namedItem('account_id') as HTMLSelectElement)?.value ||
          ''
        onSubmit(accountId || null)
      }}
    >
      <p className="text-sm text-fg-muted">{t.settleHint}</p>
      <Field label={t.accountOptional}>
        <TextSelect name="account_id" defaultValue="">
          <option value="">{t.noAccount}</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </TextSelect>
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {strings.common.cancel}
        </Button>
        <Button type="submit" disabled={isPending}>
          {t.settle}
        </Button>
      </div>
    </form>
  )
}
