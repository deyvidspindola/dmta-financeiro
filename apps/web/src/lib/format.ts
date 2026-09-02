export function formatMoney(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(iso: string): string {
  const datePart = iso.includes('T') ? iso.slice(0, 10) : iso
  const [year, month, day] = datePart.split('-').map(Number)
  if (!year || !month || !day) return iso
  return new Intl.DateTimeFormat('pt-BR').format(
    new Date(year, month - 1, day),
  )
}
