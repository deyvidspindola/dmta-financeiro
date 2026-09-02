import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { cn } from '@/lib/cn';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';

export type SelectOption = { value: string; label: string };

type Props = {
  label: string;
  value: string | null;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder: string;
  error?: string | null;
};

/** Select rotulado — toca e escolhe numa bottom sheet (o app não tem `<select>`). */
export function SelectField({ label, value, options, onChange, placeholder, error }: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View className="gap-1.5">
      <Text variant="label">{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        className={cn(
          'h-12 flex-row items-center justify-between rounded-xl border border-line bg-surface px-3',
          error && 'border-negative',
        )}
      >
        <Text className={cn(selected ? 'text-fg' : 'text-fg-subtle')} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </Text>
        <Feather name="chevron-down" size={18} color="#7c918b" />
      </Pressable>
      {error ? <Text variant="error">{error}</Text> : null}

      <Sheet open={open} onClose={() => setOpen(false)} title={label}>
        <View>
          {options.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className="flex-row items-center justify-between border-b border-line py-3 active:bg-surface-2"
            >
              <Text className={cn(option.value === value && 'font-semibold text-brand-600')}>
                {option.label}
              </Text>
              {option.value === value ? (
                <Feather name="check" size={18} color="#0f9d58" />
              ) : null}
            </Pressable>
          ))}
        </View>
      </Sheet>
    </View>
  );
}
