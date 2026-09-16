import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { cn } from '@/lib/cn';

export function ListRow({
  children,
  onPress,
  leading,
  className,
}: {
  children: ReactNode;
  onPress?: () => void;
  /** Avatar/ícone à esquerda (ex.: `CategoryIcon`) — opcional, mantém as linhas sem ele intactas. */
  leading?: ReactNode;
  className?: string;
}) {
  const row = leading ? (
    <View className="flex-row items-center gap-3">
      {leading}
      <View className="min-w-0 flex-1">{children}</View>
    </View>
  ) : (
    children
  );
  const inner = <View className={cn('border-b border-line px-4 py-3', className)}>{row}</View>;

  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:bg-surface-2">
        {inner}
      </Pressable>
    );
  }

  return inner;
}
