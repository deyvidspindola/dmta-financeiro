import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { cn } from '@/lib/cn';

export type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  center?: boolean;
  className?: string;
  edges?: Edge[];
  /**
   * Botão flutuante (FAB) fixo no canto inferior direito — renderizado
   * fora do `ScrollView`, então não rola com o conteúdo. Uso: passe um
   * `Pressable` circular já pronto (ver `app/categories.tsx` pro padrão).
   */
  fab?: ReactNode;
};

/** Container de tela: safe area + fundo do tema + (opcional) scroll/centro/FAB. */
export function Screen({
  children,
  scroll = false,
  center = false,
  className,
  edges = ['top', 'bottom'],
  fab,
}: ScreenProps) {
  const inner = cn('flex-1 px-5', center && 'justify-center', className);

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={edges}>
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
      {fab ? (
        <View className="absolute bottom-5 right-5" pointerEvents="box-none">
          {fab}
        </View>
      ) : null}
    </SafeAreaView>
  );
}
