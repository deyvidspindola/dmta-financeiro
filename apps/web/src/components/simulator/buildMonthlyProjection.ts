import type { InstallmentPurchaseSimulation } from '@/types/models'
import { formatMonthShort } from '@/lib/dates'

function monthKeyFromOffset(offset: number): string {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function monthOffsetFromKey(key: string): number {
  const now = new Date()
  const [year, month] = key.split('-').map(Number)
  if (!year || !month) return 0
  return (year - now.getFullYear()) * 12 + (month - 1 - now.getMonth())
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Monta série mensal de orçamento livre após a nova parcela (para o gráfico). */
export function buildInstallmentImpactSeries(
  result: InstallmentPurchaseSimulation,
  installments: number,
): { categories: string[]; values: number[] } {
  const count = Math.min(Math.max(installments, 3), 12)
  const tightestOffset = Math.max(
    0,
    Math.min(count - 1, monthOffsetFromKey(result.tightest_month.month)),
  )
  const categories: string[] = []
  const values: number[] = []

  for (let i = 0; i < count; i += 1) {
    const key = monthKeyFromOffset(i)
    categories.push(formatMonthShort(key))

    let baseFree = result.free_budget
    if (i > 0) {
      if (i === tightestOffset) {
        baseFree = result.tightest_month.free_budget
      } else if (i < tightestOffset) {
        baseFree = lerp(
          result.free_budget,
          result.tightest_month.free_budget,
          i / tightestOffset,
        )
      } else {
        baseFree = result.tightest_month.free_budget
      }
    }

    const withInstallment =
      i < installments
        ? Math.max(0, baseFree - result.installment_amount)
        : baseFree
    values.push(Math.round(withInstallment * 100) / 100)
  }

  return { categories, values }
}
