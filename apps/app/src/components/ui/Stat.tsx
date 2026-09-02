import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'positive' | 'negative' | 'brand';
const VALUE_TONE: Record<Tone, string> = {
  neutral: 'text-fg',
  positive: 'text-positive',
  negative: 'text-negative',
  brand: 'text-brand-600 dark:text-brand-400',
};

/** Cartão de indicador — rótulo, valor em destaque e hint opcional. */
export function Stat({
  label,
  value,
  tone = 'neutral',
  hint,
  onPress,
  className,
}: {
  label: string;
  value: ReactNode;
  tone?: Tone;
  hint?: string;
  onPress?: () => void;
  className?: string;
}) {
  const content = (
    <View className={cn('flex-col gap-1 rounded-2xl border border-line bg-surface p-4', className)}>
      <Text variant="muted" className="text-xs uppercase tracking-wide text-fg-subtle">
        {label}
      </Text>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Text className={cn('text-xl font-bold tabular-nums', VALUE_TONE[tone])}>{value}</Text>
      ) : (
        <View>{value}</View>
      )}
      {hint ? (
        <Text variant="muted" className="text-xs text-fg-subtle">
          {hint}
        </Text>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:opacity-80">
        {content}
      </Pressable>
    );
  }

  return content;
}
