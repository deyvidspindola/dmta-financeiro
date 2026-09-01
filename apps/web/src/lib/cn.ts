type ClassValue = string | number | false | null | undefined

/** Junta classes ignorando valores falsy. Sem resolução de conflito Tailwind —
 * não passe utilitários que brigam (ex.: `p-2` e `p-4` juntos). */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ')
}
