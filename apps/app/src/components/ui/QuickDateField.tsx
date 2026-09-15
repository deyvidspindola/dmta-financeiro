import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { formatDateShort } from '@/lib/dates';
import { DatePickerSheet } from '@/components/ui/DatePickerSheet';
import { Text } from '@/components/ui/Text';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Seletor rápido de data — pills "Hoje" / "Ontem" / "Outros…" (estilo
 * Mobills) em vez de abrir o calendário direto. "Outros…" abre o mesmo
 * `DatePickerSheet` do `DateField` e passa a mostrar a data escolhida no
 * lugar do texto genérico.
 */
export function QuickDateField({
  label,
  value,
  onChange,
  toneClassName,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  /** Classe de fundo do pill selecionado (ex.: `bg-negative`). */
  toneClassName: string;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const today = todayIso();
  const yesterday = yesterdayIso();
  const isToday = value === today;
  const isYesterday = value === yesterday;
  const isOther = !isToday && !isYesterday;
  const otherLabel = isOther && value ? formatDateShort(value) : t.common.other;

  return (
    <View className="gap-1.5">
      {label ? <Text variant="label">{label}</Text> : null}
      <View className="flex-row gap-2">
        <Pill selected={isToday} tone={toneClassName} onPress={() => onChange(today)}>
          {t.common.today}
        </Pill>
        <Pill selected={isYesterday} tone={toneClassName} onPress={() => onChange(yesterday)}>
          {t.common.yesterday}
        </Pill>
        <Pill selected={isOther} tone={toneClassName} onPress={() => setPickerOpen(true)}>
          {otherLabel}
        </Pill>
      </View>

      <DatePickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={label ?? t.common.other}
        value={value}
        onChange={onChange}
      />
    </View>
  );
}

function Pill({
  children,
  selected,
  tone,
  onPress,
}: {
  children: string;
  selected: boolean;
  tone: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'h-9 items-center justify-center rounded-full px-4',
        selected ? tone : 'bg-surface-2',
      )}
    >
      <Text className={cn('text-sm font-medium', selected ? 'text-white' : 'text-fg-muted')}>
        {children}
      </Text>
    </Pressable>
  );
}
