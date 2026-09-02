import { z } from 'zod'
import { strings } from '@/i18n/pt-BR'

export const companySchema = z.object({
  name: z.string().min(1, strings.common.required),
  company_name: z.string().min(1, strings.common.required),
  company_document: z.string().optional(),
})

export type CompanyFormValues = z.infer<typeof companySchema>

export const emptyCompanyValues: CompanyFormValues = {
  name: '',
  company_name: '',
  company_document: '',
}
