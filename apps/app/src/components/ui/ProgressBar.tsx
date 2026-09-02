import { View } from 'react-native';
import { cn } from '@/lib/cn';

type Tone = 'brand' | 'positive' | 'negative' | 'warning';
const BAR_TONE: Record<Tone, string> = {
  brand: 'bg-brand-600',
  positive: 'bg-positive',
  negative: 'bg-negative',
  warning: 'bg-amber-500',
};

function clampPct(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/** Barra de progresso — orçamento, meta. `value` em 0–100. */
export function ProgressBar({
  value,
  tone = 'brand',
  className,
  label,
}: {
  value: number;
  tone?: Tone;
  className?: string;
  label?: string;
}) {
  const pct = clampPct(value);
  return (
    <View
      className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-2', className)}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
      accessibilityLabel={label}
    >
      <View className={cn('h-full rounded-full', BAR_TONE[tone])} style={{ width: `${pct}%` }} />
    </View>
  );
}
