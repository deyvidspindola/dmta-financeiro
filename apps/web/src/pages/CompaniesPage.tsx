import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { contextsApi } from '@/api'
import {
  Button,
  ErrorBanner,
  Field,
  PageHeader,
  TextInput,
} from '@/components/ui-legacy'
import { strings } from '@/i18n/pt-BR'
import { getErrorMessage } from '@/lib/errors'
import { useAuthStore } from '@/store/authStore'
import { toastSuccess } from '@/store/toastStore'

const schema = z.object({
  name: z.string().min(1, strings.common.required),
  company_name: z.string().min(1, strings.common.required),
  company_document: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function CompaniesPage() {
  const queryClient = useQueryClient()
  const setContexts = useAuthStore((s) => s.setContexts)
  const setActiveScope = useAuthStore((s) => s.setActiveScope)
  const contexts = useAuthStore((s) => s.contexts)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      company_name: '',
      company_document: '',
    },
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      contextsApi.createCompanyContext({
        name: values.name,
        company_name: values.company_name,
        company_document: values.company_document?.replace(/\D/g, '') || null,
      }),
    onSuccess: async (created) => {
      const next = await contextsApi.listContexts()
      setContexts(next)
      setActiveScope(created.id)
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toastSuccess(strings.companies.created)
      form.reset()
    },
  })

  const companies = contexts.filter((c) => c.type === 'pj')

  return (
    <div className="stack">
      <PageHeader
        title={strings.companies.title}
        description={strings.companies.hint}
      />

      {companies.length > 0 ? (
        <ul className="company-list">
          {companies.map((ctx) => (
            <li key={ctx.id}>
              <strong>{ctx.name}</strong>
              {ctx.company ? (
                <span className="muted small">
                  {' '}
                  — {ctx.company.name}
                  {ctx.company.document
                    ? ` · CNPJ ${ctx.company.document}`
                    : ''}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">{strings.companies.empty}</p>
      )}

      <form
        className="form-grid panel"
        onSubmit={form.handleSubmit((values) => mutation.mutateAsync(values))}
      >
        <h2 className="section-title">{strings.companies.create}</h2>
        <Field
          label={strings.companies.contextName}
          error={form.formState.errors.name?.message}
        >
          <TextInput
            {...form.register('name')}
            placeholder={strings.companies.contextNameHint}
          />
        </Field>
        <Field
          label={strings.companies.companyName}
          error={form.formState.errors.company_name?.message}
        >
          <TextInput {...form.register('company_name')} />
        </Field>
        <Field label={strings.companies.document}>
          <TextInput
            {...form.register('company_document')}
            inputMode="numeric"
            placeholder="Somente dígitos (opcional)"
          />
        </Field>
        {mutation.isError ? (
          <ErrorBanner message={getErrorMessage(mutation.error)} />
        ) : null}
        <div className="form-actions">
          <Button type="submit" disabled={mutation.isPending}>
            {strings.common.save}
          </Button>
        </div>
      </form>
    </div>
  )
}
