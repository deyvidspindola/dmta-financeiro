import { z } from 'zod'
import { strings } from '@/i18n/pt-BR'

export const accountSchema = z.object({
  name: z.string().min(1, strings.common.required),
  bank_name: z.string().optional(),
  type: z.enum(['checking', 'savings', 'wallet', 'other']),
  balance: z.coerce.number(),
})

export type AccountFormValues = z.infer<typeof accountSchema>

export const emptyAccountValues: AccountFormValues = {
  name: '',
  bank_name: '',
  type: 'checking',
  balance: 0,
}
