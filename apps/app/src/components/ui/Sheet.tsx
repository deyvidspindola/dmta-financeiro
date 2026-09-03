import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
};

/**
 * Bottom sheet padrão — backdrop tocável + painel que sobe de baixo.
 * O conteúdo rola e o painel sobe com o teclado (`KeyboardAvoidingView`)
 * pra não cobrir os campos do form.
 */
export function Sheet({ open, onClose, title, children, className }: SheetProps) {
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/40" onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="w-full"
        >
          <SafeAreaView edges={['bottom']} className="bg-canvas">
            <View className={cn('max-h-[85%] rounded-t-3xl bg-canvas px-5 pb-4 pt-3', className)}>
              <View className="mb-3 items-center">
                <View className="h-1 w-10 rounded-full bg-line" />
              </View>
              <View className="mb-3 flex-row items-center justify-between">
                {title ? (
                  <Text variant="title" className="text-lg">
                    {title}
                  </Text>
                ) : (
                  <View />
                )}
                <Pressable onPress={onClose} hitSlop={8}>
                  <Text variant="muted">{t.common.close}</Text>
                </Pressable>
              </View>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerClassName="pb-6"
              >
                {children}
              </ScrollView>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
