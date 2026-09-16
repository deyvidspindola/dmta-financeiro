/**
 * Mesma paleta `cat-1..12` do tailwind.config.js (e do apps/web,
 * CategoryChip/useChartPalette) — hex literal porque NativeWind não
 * resolve classe dinâmica tipo `bg-cat-${n}` em runtime. Exportada (não só
 * `categoryColor`) porque também alimenta o seletor de cor no
 * cadastro/edição de categoria.
 */
export const CATEGORY_COLORS: readonly string[] = [
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#eab308',
  '#14b8a6',
  '#6366f1',
  '#ef4444',
  '#06b6d4',
  '#84cc16',
  '#a855f7',
];

/** Cor estável por categoria — mesma conta do CategoryChip do apps/web. */
export function categoryColor(categoryId: string): string {
  const n = Number(categoryId) % 12 || 1;
  // n é sempre 1..12 e o array tem 12 posições fixas — nunca undefined.
  return CATEGORY_COLORS[n - 1]!;
}
