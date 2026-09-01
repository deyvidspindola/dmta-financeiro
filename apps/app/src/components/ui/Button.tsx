import { ActivityIndicator, Pressable, type PressableProps, View } from 'react-native';
import { cn } from '@/lib/cn';
import { Text } from '@/components/ui/Text';

type Variant = 'primary' | 'secondary' | 'ghost';

const CONTAINER: Record<Variant, string> = {
  primary: 'bg-brand-600 active:bg-brand-700',
  secondary: 'bg-surface-2 border border-line active:bg-line',
  ghost: 'bg-transparent active:bg-surface-2',
};

const LABEL: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-fg',
  ghost: 'text-brand-600',
};

export type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: Variant;
  loading?: boolean;
};

/** Botão base (fallback NativeWind — ver apps/app/CLAUDE.md). */
export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      role="button"
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      className={cn(
        'h-12 flex-row items-center justify-center rounded-xl px-4',
        CONTAINER[variant],
        isDisabled && 'opacity-50',
        className,
      )}
      {...props}
    >
      <View className="flex-row items-center gap-2">
        {loading ? <ActivityIndicator size="small" color="#fff" /> : null}
        <Text className={cn('text-base font-semibold', LABEL[variant])}>{label}</Text>
      </View>
    </Pressable>
  );
}
