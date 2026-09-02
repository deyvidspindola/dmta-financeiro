/** Converte data exibida/selecionada para ISO `YYYY-MM-DD`. */
export function toIsoDate(raw: string | undefined | null): string {
  if (!raw) return ''
  const trimmed = raw.trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10)

  // DD/MM/YYYY ou DD.MM.YYYY
  const br = trimmed.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/)
  if (br) {
    const day = br[1].padStart(2, '0')
    const month = br[2].padStart(2, '0')
    return `${br[3]}-${month}-${day}`
  }

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return ''
  const y = parsed.getFullYear()
  const m = String(parsed.getMonth() + 1).padStart(2, '0')
  const d = String(parsed.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Formata ISO `YYYY-MM-DD` para exibição pt-BR. */
export function formatIsoDatePtBr(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
