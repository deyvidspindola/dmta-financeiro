import { Pressable, type PressableProps, View, type ViewProps } from 'react-native';
import { cn } from '@/lib/cn';

const BASE = 'rounded-2xl border border-line bg-surface p-4';

// "hero" — bloco de destaque (saldo do painel, valor do lançamento):
// sem borda, radius maior e superfície um degrau acima do `surface` comum,
// mesma linguagem visual dos cards "flutuantes" do Mobills.
const VARIANT = {
  default: BASE,
  hero: 'rounded-3xl bg-surface-2 p-5',
};

export function Card({
  className,
  variant = 'default',
  ...props
}: ViewProps & { variant?: keyof typeof VARIANT }) {
  return <View className={cn(VARIANT[variant], className)} {...props} />;
}

export function PressableCard({ className, ...props }: PressableProps) {
  return <Pressable className={cn(BASE, 'active:bg-surface-2', className)} {...props} />;
}
