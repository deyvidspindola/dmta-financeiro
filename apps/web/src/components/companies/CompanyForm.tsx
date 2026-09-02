import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  companySchema,
  emptyCompanyValues,
  type CompanyFormValues,
} from '@/components/companies/schemas'
import {
  Button,
  ErrorBanner,
  Field,
  TextInput,
} from '@/components/ui'
import { strings } from '@/i18n/pt-BR'

const t = strings.companies

type CompanyFormProps = {
  isPending?: boolean
  error?: string | null
  onSubmit: (values: CompanyFormValues) => void
  onCancel: () => void
}

export function CompanyForm({
  isPending,
  error,
  onSubmit,
  onCancel,
}: CompanyFormProps) {
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: emptyCompanyValues,
  })

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <Field
        label={t.contextName}
        error={form.formState.errors.name?.message}
      >
        <TextInput
          {...form.register('name')}
          placeholder={t.contextNameHint}
        />
      </Field>
      <Field
        label={t.companyName}
        error={form.formState.errors.company_name?.message}
      >
        <TextInput {...form.register('company_name')} />
      </Field>
      <Field label={t.document}>
        <TextInput
          {...form.register('company_document')}
          inputMode="numeric"
          placeholder={t.documentPlaceholder}
        />
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
