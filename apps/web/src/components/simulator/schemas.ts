import { z } from 'zod'

export const simulatorSchema = z.object({
  amount: z.coerce.number().positive(),
  installments: z.coerce.number().int().min(1).max(360),
  cash_price: z.coerce.number().optional(),
})

export type SimulatorFormValues = z.infer<typeof simulatorSchema>

export const emptySimulatorValues: SimulatorFormValues = {
  amount: 0,
  installments: 12,
  cash_price: undefined,
}
