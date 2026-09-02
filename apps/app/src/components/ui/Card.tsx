import { Pressable, type PressableProps, View, type ViewProps } from 'react-native';
import { cn } from '@/lib/cn';

const BASE = 'rounded-2xl border border-line bg-surface p-4';

export function Card({ className, ...props }: ViewProps) {
  return <View className={cn(BASE, className)} {...props} />;
}

export function PressableCard({ className, ...props }: PressableProps) {
  return <Pressable className={cn(BASE, 'active:bg-surface-2', className)} {...props} />;
}
