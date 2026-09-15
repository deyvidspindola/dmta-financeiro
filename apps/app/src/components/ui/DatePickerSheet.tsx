import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { cn } from '@/lib/cn';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** ISO `YYYY-MM-DD` ou string vazia. */
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
  clearLabel?: string;
};

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function iso(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Calendário em bottom sheet — extraído do `DateField` pra ser reusado pelo `QuickDateField`. */
export function DatePickerSheet({
  open,
  onClose,
  title,
  value,
  onChange,
  optional,
  clearLabel,
}: Props) {
  const initial = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const grid = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const lead = first.getDay();
    const cells: (number | null)[] = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
    new Date(viewYear, viewMonth, 1),
  );

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => shiftMonth(-1)} hitSlop={8} className="p-1">
            <Feather name="chevron-left" size={20} color="#7c918b" />
          </Pressable>
          <Text className="font-semibold capitalize">{monthLabel}</Text>
          <Pressable onPress={() => shiftMonth(1)} hitSlop={8} className="p-1">
            <Feather name="chevron-right" size={20} color="#7c918b" />
          </Pressable>
        </View>

        <View className="flex-row">
          {WEEKDAYS.map((w, i) => (
            <Text key={i} variant="muted" className="flex-1 text-center text-xs">
              {w}
            </Text>
          ))}
        </View>

        <View className="flex-row flex-wrap">
          {grid.map((day, i) => {
            const dateIso = day ? iso(viewYear, viewMonth, day) : '';
            const selected = day && dateIso === value;
            return (
              <View key={i} className="h-10 w-[14.28%] items-center justify-center p-0.5">
                {day ? (
                  <Pressable
                    onPress={() => {
                      onChange(dateIso);
                      onClose();
                    }}
                    className={cn(
                      'h-9 w-9 items-center justify-center rounded-full',
                      selected ? 'bg-brand-600' : 'active:bg-surface-2',
                    )}
                  >
                    <Text className={cn('text-sm', selected && 'font-semibold text-white')}>
                      {day}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>

        {optional && value ? (
          <Pressable
            onPress={() => {
              onChange('');
              onClose();
            }}
            className="self-center py-2"
          >
            <Text variant="muted">{clearLabel ?? 'Limpar'}</Text>
          </Pressable>
        ) : null}
      </View>
    </Sheet>
  );
}
