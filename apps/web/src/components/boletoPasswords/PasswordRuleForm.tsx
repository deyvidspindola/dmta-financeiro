import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  emptyPasswordRuleValues,
  passwordRuleSchema,
  type PasswordRuleFormValues,
} from '@/components/boletoPasswords/passwordRuleUtils'
import {
  Button,
  ErrorBanner,
  Field,
  TextInput,
  TextSelect,
} from '@/components/ui'
import { strings } from '@/i18n/pt-BR'

const t = strings.boletoPasswords

type PasswordRuleFormProps = {
  isPending?: boolean
  error?: string | null
  onSubmit: (values: PasswordRuleFormValues) => void
  onCancel: () => void
}

export function PasswordRuleForm({
  isPending,
  error,
  onSubmit,
  onCancel,
}: PasswordRuleFormProps) {
  const form = useForm<PasswordRuleFormValues>({
    resolver: zodResolver(passwordRuleSchema),
    defaultValues: emptyPasswordRuleValues,
  })
  const ruleType = form.watch('rule_type')

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <Field
        label={t.senderDomain}
        error={form.formState.errors.sender_domain?.message}
      >
        <TextInput
          {...form.register('sender_domain')}
          placeholder={t.senderDomainHint}
        />
      </Field>
      <Field label={t.ruleType}>
        <TextSelect {...form.register('rule_type')}>
          <option value="fixed">{t.types.fixed}</option>
          <option value="cpf_digits">{t.types.cpf_digits}</option>
          <option value="cnpj_digits">{t.types.cnpj_digits}</option>
          <option value="birth_date">{t.types.birth_date}</option>
        </TextSelect>
      </Field>
      {ruleType === 'fixed' ? (
        <Field label={t.password}>
          <TextInput type="password" {...form.register('password')} />
        </Field>
      ) : null}
      {ruleType === 'cpf_digits' || ruleType === 'cnpj_digits' ? (
        <Field label={t.document}>
          <TextInput {...form.register('document')} />
        </Field>
      ) : null}
      {ruleType === 'birth_date' ? (
        <Field label={t.date}>
          <TextInput type="date" {...form.register('date')} />
        </Field>
      ) : null}
      <Field label={t.label}>
        <TextInput {...form.register('label')} />
      </Field>
      {error ? <ErrorBanner message={error} /> : null}
      <div className="flex flex-wrap justify-end gap-2">
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
