import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { cn } from '@/lib/cn';

export function ListRow({
  children,
  onPress,
  className,
}: {
  children: ReactNode;
  onPress?: () => void;
  className?: string;
}) {
  const inner = <View className={cn('border-b border-line px-1 py-3', className)}>{children}</View>;

  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:bg-surface-2">
        {inner}
      </Pressable>
    );
  }

  return inner;
}
