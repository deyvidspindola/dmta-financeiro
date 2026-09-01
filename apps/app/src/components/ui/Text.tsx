import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { cn } from '@/lib/cn';

type Variant = 'body' | 'muted' | 'title' | 'heading' | 'label' | 'error';

const VARIANT: Record<Variant, string> = {
  body: 'text-base text-fg',
  muted: 'text-sm text-fg-muted',
  title: 'text-xl font-semibold text-fg',
  heading: 'text-2xl font-bold text-fg',
  label: 'text-sm font-medium text-fg',
  error: 'text-sm text-negative',
};

export type TextProps = RNTextProps & { variant?: Variant };

/**
 * Componente de texto base (fallback NativeWind — react-native-reusables
 * não foi adotado, ver apps/app/CLAUDE.md). Todo texto de UI passa por aqui
 * e o conteúdo vem do i18n (`src/i18n/pt-BR.ts`).
 */
export function Text({ variant = 'body', className, ...props }: TextProps) {
  return <RNText className={cn(VARIANT[variant], className)} {...props} />;
}
