import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cn } from '@/lib/cn';

export type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  center?: boolean;
  className?: string;
};

/** Container de tela: safe area + fundo do tema + (opcional) scroll/centro. */
export function Screen({ children, scroll = false, center = false, className }: ScreenProps) {
  const inner = cn('flex-1 px-5', center && 'justify-center', className);

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            className="flex-1"
            contentContainerClassName={cn('px-5 py-4 grow', center && 'justify-center')}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        ) : (
          <View className={inner}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
