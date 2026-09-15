import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { cn } from '@/lib/cn';
import { DatePickerSheet } from '@/components/ui/DatePickerSheet';
import { Text } from '@/components/ui/Text';

type Props = {
  label: string;
  /** ISO `YYYY-MM-DD` ou string vazia. */
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  optional?: boolean;
  clearLabel?: string;
};

function displayBR(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
  const [y, m, d] = value.split('-');
  return `${d}/${m}/${y}`;
}

/** Campo de data — só leitura; toca e escolhe num calendário (Sheet). Valor ISO. */
export function DateField({ label, value, onChange, error, optional, clearLabel }: Props) {
  const [open, setOpen] = useState(false);

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
        <Text className={cn(value ? 'text-fg' : 'text-fg-subtle')}>
          {displayBR(value) || 'DD/MM/AAAA'}
        </Text>
        <Feather name="calendar" size={18} color="#7c918b" />
      </Pressable>
      {error ? <Text variant="error">{error}</Text> : null}

      <DatePickerSheet
        open={open}
        onClose={() => setOpen(false)}
        title={label}
        value={value}
        onChange={onChange}
        optional={optional}
        clearLabel={clearLabel}
      />
    </View>
  );
}
