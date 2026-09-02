import { z } from 'zod'
import { strings } from '@/i18n/pt-BR'

export const billSchema = z.object({
  description: z.string().min(1, strings.common.required),
  amount: z.coerce.number().positive(),
  due_date: z.string().min(1, strings.common.required),
  kind: z.enum(['payable', 'receivable']),
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled']),
  category_id: z.string().nullable(),
  barcode: z.string().optional(),
})

export type BillFormValues = z.infer<typeof billSchema>

export const emptyBillValues: BillFormValues = {
  description: '',
  amount: 0,
  due_date: '',
  kind: 'payable',
  status: 'pending',
  category_id: null,
  barcode: '',
}

export const payBillSchema = z.object({
  account_id: z.string().min(1, strings.common.required),
  occurred_at: z.string().optional(),
})

export type PayBillFormValues = z.infer<typeof payBillSchema>
