import { View } from 'react-native';
import { ContextSwitcher } from '@/components/ContextSwitcher';
import { MonthNavigator } from '@/components/MonthNavigator';

/** Barra superior compartilhada das telas de aba (mês + contexto). */
export function AppHeader() {
  return (
    <View className="flex-row items-center justify-between gap-3 border-b border-line bg-canvas px-4 py-3">
      <MonthNavigator />
      <ContextSwitcher />
    </View>
  );
}
