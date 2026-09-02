const moneyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

/** Formata reais (número) como `R$ 1.234,56`. */
export function formatMoneyInput(value: number): string {
  if (!Number.isFinite(value)) return moneyFormatter.format(0)
  return moneyFormatter.format(value)
}

/**
 * Extrai dígitos e interpreta como centavos → reais com 2 casas.
 * Digitar `1234` vira `12,34`.
 */
export function parseMoneyInput(raw: string): number {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return 0
  return Number(digits) / 100
}
