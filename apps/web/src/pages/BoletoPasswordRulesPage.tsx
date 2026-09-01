import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { z } from 'zod'
import { boletoPasswordRulesApi } from '@/api'
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
} from '@/components/ui-legacy'
import { strings } from '@/i18n/pt-BR'
import { getErrorMessage } from '@/lib/errors'
import { toastError, toastSuccess } from '@/store/toastStore'
import type { BoletoPasswordRuleType } from '@/types/models'

const schema = z.object({
  sender_domain: z.string().min(1, strings.common.required),
  rule_type: z.enum(['cpf_digits', 'cnpj_digits', 'birth_date', 'fixed']),
  label: z.string().optional(),
  document: z.string().optional(),
  date: z.string().optional(),
  password: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const emptyValues: FormValues = {
  sender_domain: '*',
  rule_type: 'fixed',
  label: '',
  document: '',
  date: '',
  password: '',
}

function paramsFromForm(values: FormValues): Record<string, string> {
  if (values.rule_type === 'fixed') {
    return { password: values.password?.trim() ?? '' }
  }
  if (values.rule_type === 'birth_date') {
    return { date: values.date ?? '' }
  }
  return { document: values.document ?? '' }
}

function typeLabel(type: BoletoPasswordRuleType): string {
  return strings.boletoPasswords.types[type]
}

export function BoletoPasswordRulesPage() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  })
  const ruleType = form.watch('rule_type')

  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ['boleto-password-rules'],
    queryFn: () => boletoPasswordRulesApi.listBoletoPasswordRules(),
  })

  const sorted = useMemo(
    () =>
      [...data].sort((a, b) =>
        a.sender_domain.localeCompare(b.sender_domain, 'pt-BR'),
      ),
    [data],
  )

  const createMutation = useMutation({
    mutationFn: (values: FormValues) =>
      boletoPasswordRulesApi.createBoletoPasswordRule({
        sender_domain: values.sender_domain.trim(),
        rule_type: values.rule_type,
        rule_params: paramsFromForm(values),
        label: values.label?.trim() || null,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['boleto-password-rules'] })
      toastSuccess(strings.boletoPasswords.created)
      form.reset(emptyValues)
      setOpen(false)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (ruleId: string) =>
      boletoPasswordRulesApi.deleteBoletoPasswordRule(ruleId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['boleto-password-rules'] })
      toastSuccess(strings.boletoPasswords.deleted)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  return (
    <div className="stack">
      <PageHeader
        title={strings.boletoPasswords.title}
        description={strings.boletoPasswords.hint}
        actions={
          <Button onClick={() => setOpen(true)}>
            {strings.boletoPasswords.create}
          </Button>
        }
      />

      {isLoading ? <LoadingBlock label={strings.common.loading} /> : null}
      {isError ? <ErrorBanner message={getErrorMessage(error)} /> : null}

      {!isLoading && sorted.length === 0 ? (
        <EmptyState message={strings.boletoPasswords.empty} />
      ) : null}

      {sorted.length > 0 ? (
        <DataTable
          headers={[
            strings.boletoPasswords.senderDomain,
            strings.boletoPasswords.ruleType,
            strings.boletoPasswords.label,
            strings.common.actions,
          ]}
        >
          {sorted.map((rule) => (
            <tr key={rule.id}>
              <td className="mono">{rule.sender_domain}</td>
              <td>{typeLabel(rule.rule_type)}</td>
              <td>{rule.label ?? '—'}</td>
              <td className="actions-cell">
                <IconButton
                  label={strings.common.delete}
                  icon={Trash2}
                  variant="danger"
                  onClick={() => {
                    if (!window.confirm(strings.boletoPasswords.confirmDelete)) {
                      return
                    }
                    deleteMutation.mutate(rule.id)
                  }}
                  disabled={deleteMutation.isPending}
                />
              </td>
            </tr>
          ))}
        </DataTable>
      ) : null}

      {open ? (
        <Modal
          title={strings.boletoPasswords.create}
          onClose={() => setOpen(false)}
        >
          <form
            className="form-grid"
            onSubmit={form.handleSubmit((values) =>
              createMutation.mutateAsync(values),
            )}
          >
            <Field
              label={strings.boletoPasswords.senderDomain}
              error={form.formState.errors.sender_domain?.message}
            >
              <TextInput
                {...form.register('sender_domain')}
                placeholder={strings.boletoPasswords.senderDomainHint}
              />
            </Field>
            <Field label={strings.boletoPasswords.ruleType}>
              <TextSelect {...form.register('rule_type')}>
                <option value="fixed">
                  {strings.boletoPasswords.types.fixed}
                </option>
                <option value="cpf_digits">
                  {strings.boletoPasswords.types.cpf_digits}
                </option>
                <option value="cnpj_digits">
                  {strings.boletoPasswords.types.cnpj_digits}
                </option>
                <option value="birth_date">
                  {strings.boletoPasswords.types.birth_date}
                </option>
              </TextSelect>
            </Field>
            {ruleType === 'fixed' ? (
              <Field label={strings.boletoPasswords.password}>
                <TextInput type="password" {...form.register('password')} />
              </Field>
            ) : null}
            {ruleType === 'cpf_digits' || ruleType === 'cnpj_digits' ? (
              <Field label={strings.boletoPasswords.document}>
                <TextInput {...form.register('document')} />
              </Field>
            ) : null}
            {ruleType === 'birth_date' ? (
              <Field label={strings.boletoPasswords.date}>
                <TextInput type="date" {...form.register('date')} />
              </Field>
            ) : null}
            <Field label={strings.boletoPasswords.label}>
              <TextInput {...form.register('label')} />
            </Field>
            {createMutation.isError ? (
              <ErrorBanner message={getErrorMessage(createMutation.error)} />
            ) : null}
            <div className="form-actions">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                {strings.common.cancel}
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {strings.common.save}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  )
}
