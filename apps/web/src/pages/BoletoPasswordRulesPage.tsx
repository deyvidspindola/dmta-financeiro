import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { boletoPasswordRulesApi } from '@/api'
import { PasswordRuleForm } from '@/components/boletoPasswords/PasswordRuleForm'
import {
  paramsFromForm,
  type PasswordRuleFormValues,
  typeLabel,
} from '@/components/boletoPasswords/passwordRuleUtils'
import {
  Button,
  DataTable,
  EmptyState,
  ErrorBanner,
  IconButton,
  LoadingBlock,
  Modal,
  PageHeader,
  Td,
  Tr,
} from '@/components/ui'
import { strings } from '@/i18n/pt-BR'
import { getErrorMessage } from '@/lib/errors'
import { toastError, toastSuccess } from '@/store/toastStore'

const t = strings.boletoPasswords

export function BoletoPasswordRulesPage() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

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
    mutationFn: (values: PasswordRuleFormValues) =>
      boletoPasswordRulesApi.createBoletoPasswordRule({
        sender_domain: values.sender_domain.trim(),
        rule_type: values.rule_type,
        rule_params: paramsFromForm(values),
        label: values.label?.trim() || null,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['boleto-password-rules'] })
      toastSuccess(t.created)
      setOpen(false)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (ruleId: string) =>
      boletoPasswordRulesApi.deleteBoletoPasswordRule(ruleId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['boleto-password-rules'] })
      toastSuccess(t.deleted)
    },
    onError: (err) => toastError(getErrorMessage(err)),
  })

  return (
    <div className="space-y-6 bg-canvas text-fg">
      <PageHeader
        title={t.title}
        description={t.hint}
        actions={<Button onClick={() => setOpen(true)}>{t.create}</Button>}
      />

      {isLoading ? <LoadingBlock label={strings.common.loading} /> : null}
      {isError ? <ErrorBanner message={getErrorMessage(error)} /> : null}

      {!isLoading && sorted.length === 0 ? (
        <EmptyState message={t.empty} />
      ) : null}

      {sorted.length > 0 ? (
        <DataTable
          headers={[
            t.senderDomain,
            t.ruleType,
            t.label,
            strings.common.actions,
          ]}
        >
          {sorted.map((rule) => (
            <Tr key={rule.id}>
              <Td className="font-mono text-xs">{rule.sender_domain}</Td>
              <Td>{typeLabel(rule.rule_type)}</Td>
              <Td>{rule.label ?? '—'}</Td>
              <Td>
                <IconButton
                  label={strings.common.delete}
                  icon={Trash2}
                  variant="danger"
                  onClick={() => {
                    if (!window.confirm(t.confirmDelete)) return
                    deleteMutation.mutate(rule.id)
                  }}
                  disabled={deleteMutation.isPending}
                />
              </Td>
            </Tr>
          ))}
        </DataTable>
      ) : null}

      {open ? (
        <Modal title={t.create} onClose={() => setOpen(false)}>
          <PasswordRuleForm
            isPending={createMutation.isPending}
            error={
              createMutation.isError
                ? getErrorMessage(createMutation.error)
                : null
            }
            onCancel={() => setOpen(false)}
            onSubmit={(values) => createMutation.mutate(values)}
          />
        </Modal>
      ) : null}
    </div>
  )
}
