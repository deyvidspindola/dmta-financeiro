import { View, type ViewProps } from 'react-native';
import { cn } from '@/lib/cn';

/** Placeholder animado para estados de loading. */
export function Skeleton({ className, ...props }: ViewProps) {
  return <View className={cn('animate-pulse rounded-lg bg-surface-2', className)} {...props} />;
}
