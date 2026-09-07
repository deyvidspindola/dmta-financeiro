import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
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
 *
 * O painel é limitado a 88% da altura da janela (valor em pixels, não `%` —
 * uma `maxHeight` em porcentagem não resolve contra pai de altura
 * indefinida e o conteúdo alto vazava pra fora da tela). A `ScrollView`
 * encolhe dentro desse limite (`flexShrink`), então forms longos rolam em
 * vez de empurrar a alça/título pra fora.
 *
 * Teclado: `KeyboardAvoidingView` com `padding` no iOS e `height` no
 * Android — no Android o `<Modal>` não respeita `adjustResize`, então sem
 * o `height` os campos de baixo ficavam atrás do teclado.
 */
export function Sheet({ open, onClose, title, children, className }: SheetProps) {
  const { height } = useWindowDimensions();

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/40" onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="w-full"
        >
          <SafeAreaView edges={['bottom']} className="bg-canvas">
            <View
              style={{ maxHeight: height * 0.88 }}
              className={cn('rounded-t-3xl bg-canvas px-5 pb-4 pt-3', className)}
            >
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
                style={{ flexShrink: 1 }}
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
