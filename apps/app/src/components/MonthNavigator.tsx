import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { Text } from '@/components/ui';
import { t } from '@/i18n';
import { currentMonthKey, formatMonthLabel } from '@/lib/dates';
import { useMonthStore } from '@/store/monthStore';

const ICON_COLORS = {
  light: { fg: '#0d1b16', brand: '#10b981' },
  dark: { fg: '#e7efec', brand: '#34d399' },
} as const;

/** ‹ Setembro 2026 › — navegador de mês global. */
export function MonthNavigator() {
  const { month, shift, reset } = useMonthStore();
  const { colorScheme } = useColorScheme();
  const palette = colorScheme === 'dark' ? ICON_COLORS.dark : ICON_COLORS.light;
  const isCurrent = month === currentMonthKey();
  const label = formatMonthLabel(month);

  return (
    <View className="h-10 flex-row items-center rounded-xl border border-line bg-surface px-1">
      <Pressable
        accessibilityLabel={t.monthNav.prevMonth}
        onPress={() => shift(-1)}
        className="rounded-lg p-2 active:bg-surface-2"
      >
        <Feather name="chevron-left" size={20} color={palette.fg} />
      </Pressable>
      <Pressable
        accessibilityLabel={isCurrent ? label : t.monthNav.backToCurrent}
        onPress={reset}
        className="flex-row items-center gap-1.5 rounded-lg px-3 py-1.5 active:bg-surface-2"
      >
        <Text className="text-sm font-medium">{label}</Text>
        {!isCurrent ? (
          <View className="size-1.5 rounded-full" style={{ backgroundColor: palette.brand }} />
        ) : null}
      </Pressable>
      <Pressable
        accessibilityLabel={t.monthNav.nextMonth}
        onPress={() => shift(1)}
        className="rounded-lg p-2 active:bg-surface-2"
      >
        <Feather name="chevron-right" size={20} color={palette.fg} />
      </Pressable>
    </View>
  );
}
