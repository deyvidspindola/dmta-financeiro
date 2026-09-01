import { TextInput, type TextInputProps, View } from 'react-native';
import { cn } from '@/lib/cn';
import { Text } from '@/components/ui/Text';

export type TextFieldProps = TextInputProps & {
  label: string;
  error?: string | null;
};

/** Campo de texto rotulado (fallback NativeWind — ver apps/app/CLAUDE.md). */
export function TextField({ label, error, className, ...props }: TextFieldProps) {
  return (
    <View className="gap-1.5">
      <Text variant="label">{label}</Text>
      <TextInput
        placeholderTextColor="#7c918b"
        className={cn(
          'h-12 rounded-xl border border-line bg-surface px-3 text-base text-fg',
          error && 'border-negative',
          className,
        )}
        {...props}
      />
      {error ? <Text variant="error">{error}</Text> : null}
    </View>
  );
}
