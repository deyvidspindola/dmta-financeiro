import { z } from 'zod'
import { strings } from '@/i18n/pt-BR'
import type { BoletoPasswordRuleType } from '@/types/models'

export const passwordRuleSchema = z.object({
  sender_domain: z.string().min(1, strings.common.required),
  rule_type: z.enum(['cpf_digits', 'cnpj_digits', 'birth_date', 'fixed']),
  label: z.string().optional(),
  document: z.string().optional(),
  date: z.string().optional(),
  password: z.string().optional(),
})

export type PasswordRuleFormValues = z.infer<typeof passwordRuleSchema>

export const emptyPasswordRuleValues: PasswordRuleFormValues = {
  sender_domain: '*',
  rule_type: 'fixed',
  label: '',
  document: '',
  date: '',
  password: '',
}

export function paramsFromForm(
  values: PasswordRuleFormValues,
): Record<string, string> {
  if (values.rule_type === 'fixed') {
    return { password: values.password?.trim() ?? '' }
  }
  if (values.rule_type === 'birth_date') {
    return { date: values.date ?? '' }
  }
  return { document: values.document ?? '' }
}

export function typeLabel(type: BoletoPasswordRuleType): string {
  return strings.boletoPasswords.types[type]
}
