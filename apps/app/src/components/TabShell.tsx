import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/AppHeader';
import { Text } from '@/components/ui';

type TabShellProps = {
  title?: string;
  children?: ReactNode;
};

/** Layout padrão das telas de aba: header + conteúdo rolável. */
export function TabShell({ title, children }: TabShellProps) {
  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <AppHeader />
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-5 pb-28 pt-4"
        keyboardShouldPersistTaps="handled"
      >
        {title ? <Text variant="title">{title}</Text> : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
