import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { cn } from '@/lib/cn';

export type BadgeTone = 'neutral' | 'brand' | 'accent';

const TONE: Record<BadgeTone, string> = {
  neutral: 'bg-surface-2 text-fg-muted',
  brand: 'bg-brand-500/15 text-brand-700 dark:text-brand-300',
  accent: 'bg-accent-500/15 text-accent-700 dark:text-accent-300',
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
    <View className={cn('self-start rounded-full px-2 py-0.5', TONE[tone], className)}>
      <Text className="text-[10px] font-medium">{children}</Text>
    </View>
  );
}
