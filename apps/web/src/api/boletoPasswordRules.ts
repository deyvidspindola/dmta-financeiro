import { useMocks } from '@/api/config'
import { http, unwrapData } from '@/api/http'
import { asId } from '@/api/mappers'
import { mockApi } from '@/mocks/store'
import type { BoletoPasswordRule, BoletoPasswordRuleType } from '@/types/models'

export type CreateBoletoPasswordRuleInput = {
  sender_domain: string
  rule_type: BoletoPasswordRuleType
  rule_params: Record<string, string>
  label: string | null
}

function mapRule(raw: {
  id: string | number
  sender_domain: string
  rule_type: BoletoPasswordRuleType
  rule_params: Record<string, string>
  label: string | null
  last_used_at?: string | null
  created_at?: string | null
}): BoletoPasswordRule {
  return {
    id: asId(raw.id),
    sender_domain: raw.sender_domain,
    rule_type: raw.rule_type,
    rule_params: raw.rule_params ?? {},
    label: raw.label,
    last_used_at: raw.last_used_at ?? null,
    created_at: raw.created_at ?? null,
  }
}

export async function listBoletoPasswordRules(): Promise<BoletoPasswordRule[]> {
  if (useMocks) return mockApi.listBoletoPasswordRules()
  const payload = await http.get<
    | Array<Parameters<typeof mapRule>[0]>
    | { data: Array<Parameters<typeof mapRule>[0]> }
  >('/boleto-password-rules')
  return unwrapData(payload).map(mapRule)
}

export async function createBoletoPasswordRule(
  input: CreateBoletoPasswordRuleInput,
): Promise<BoletoPasswordRule> {
  if (useMocks) return mockApi.createBoletoPasswordRule(input)
  const created = unwrapData(
    await http.post<
      | Parameters<typeof mapRule>[0]
      | { data: Parameters<typeof mapRule>[0] }
    >('/boleto-password-rules', input),
  )
  return mapRule(created)
}

export async function deleteBoletoPasswordRule(ruleId: string): Promise<void> {
  if (useMocks) return mockApi.deleteBoletoPasswordRule(ruleId)
  await http.delete(`/boleto-password-rules/${ruleId}`)
}
