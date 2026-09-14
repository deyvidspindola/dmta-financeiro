import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { cn } from '@/lib/cn';

export type BadgeTone = 'neutral' | 'brand' | 'accent' | 'negative' | 'warning';

const TONE: Record<BadgeTone, string> = {
  neutral: 'bg-surface-2 text-fg-muted',
  brand: 'bg-brand-500/15 text-brand-700 dark:text-brand-300',
  accent: 'bg-accent-500/15 text-accent-700 dark:text-accent-300',
  // `bg-red-500/15` (paleta literal), não `bg-negative/15` (token vindo de
  // var(--negative)) — NativeWind não calcula opacidade sobre CSS var em
  // build time, o fundo não aparecia, só o texto. Mesmo hex de --negative
  // (red-600 claro / red-400 escuro), texto continua no token semântico.
  negative: 'bg-red-500/15 text-negative',
  warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    // `self-center` (não `self-start`) — numa linha horizontal, `self-start`
    // ignora o `items-center` do container e empurra o badge pro topo do
    // eixo cruzado (ex.: badge "PF" ao lado do nome do contexto). Centrado
    // continua evitando o badge esticar largura total quando usado sozinho
    // numa coluna — mesmo motivo que o `self-start` original resolvia.
    <View className={cn('self-center rounded-full px-2 py-0.5', TONE[tone], className)}>
      <Text className="text-[10px] font-medium">{children}</Text>
    </View>
  );
}
