/**
 * Paleta de cores para contas — mesma lógica de `categoryColor.ts`,
 * mas com cores voltadas para contas bancárias/carteiras. Hex literal
 * porque NativeWind não resolve classe dinâmica tipo `bg-acc-${n}` em
 * runtime.
 */
const ACCOUNT_COLORS: readonly { name: string; hex: string }[] = [
  { name: 'red', hex: '#ef4444' },
  { name: 'orange', hex: '#f97316' },
  { name: 'amber', hex: '#f59e0b' },
  { name: 'yellow', hex: '#eab308' },
  { name: 'lime', hex: '#84cc16' },
  { name: 'green', hex: '#10b981' },
  { name: 'emerald', hex: '#059669' },
  { name: 'teal', hex: '#14b8a6' },
  { name: 'cyan', hex: '#06b6d4' },
  { name: 'sky', hex: '#0ea5e9' },
  { name: 'blue', hex: '#3b82f6' },
  { name: 'indigo', hex: '#6366f1' },
  { name: 'violet', hex: '#8b5cf6' },
  { name: 'purple', hex: '#a855f7' },
  { name: 'fuchsia', hex: '#d946ef' },
  { name: 'pink', hex: '#ec4899' },
  { name: 'rose', hex: '#f43f5e' },
  { name: 'slate', hex: '#64748b' },
];

/** Paleta disponível para escolha do usuário. */
export const ACCOUNT_COLOR_OPTIONS = ACCOUNT_COLORS;

/** Cor padrão quando a conta não tem cor definida. */
export const DEFAULT_ACCOUNT_COLOR = '#64748b'; // slate

/**
 * Resolve a cor de uma conta pelo nome da cor salvo no backend.
 * Se a cor não existir ou for null/undefined, retorna a cor padrão.
 */
export function accountColor(colorName: string | null | undefined): string {
  if (!colorName) return DEFAULT_ACCOUNT_COLOR;
  const found = ACCOUNT_COLORS.find((c) => c.name === colorName);
  return found?.hex ?? DEFAULT_ACCOUNT_COLOR;
}
