import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  ErrorBanner,
  Field,
  TextInput,
  TextSelect,
} from '@/components/ui'
import {
  accountSchema,
  emptyAccountValues,
  type AccountFormValues,
} from '@/components/accounts/schemas'
import { strings } from '@/i18n/pt-BR'

const t = strings.accounts

type AccountFormProps = {
  initialValues?: Partial<AccountFormValues>
  isEdit?: boolean
  isPending?: boolean
  error?: string | null
  onSubmit: (values: AccountFormValues) => void
  onCancel: () => void
}

export function AccountForm({
  initialValues,
  isEdit = false,
  isPending = false,
  error,
  onSubmit,
  onCancel,
}: AccountFormProps) {
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: { ...emptyAccountValues, ...initialValues },
  })

  return (
    <form
      className="grid gap-4"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <Field label={t.name} error={form.formState.errors.name?.message}>
        <TextInput {...form.register('name')} />
      </Field>
      <Field label={t.bankName}>
        <TextInput {...form.register('bank_name')} />
      </Field>
      <Field label={t.type}>
        <TextSelect {...form.register('type')}>
          {(
            Object.keys(t.types) as Array<keyof typeof t.types>
          ).map((key) => (
            <option key={key} value={key}>
              {t.types[key]}
            </option>
          ))}
        </TextSelect>
      </Field>
      {!isEdit ? (
        <Field
          label={t.balance}
          error={form.formState.errors.balance?.message}
        >
          <TextInput
            type="number"
            step="0.01"
            {...form.register('balance')}
          />
        </Field>
      ) : null}
      {error ? <ErrorBanner message={error} /> : null}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {strings.common.cancel}
        </Button>
        <Button type="submit" disabled={isPending}>
          {strings.common.save}
        </Button>
      </div>
    </form>
  )
}
