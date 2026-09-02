import type { ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';
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
 * Usado pros detalhes de lançamento, cartão etc. (abre em modal, nunca
 * navega pra outra tela — pedido do dono).
 */
export function Sheet({ open, onClose, title, children, className }: SheetProps) {
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <SafeAreaView edges={['bottom']} className="bg-canvas">
        <View className={cn('max-h-[80%] rounded-t-3xl bg-canvas px-5 pb-4 pt-3', className)}>
          <View className="mb-3 items-center">
            <View className="h-1 w-10 rounded-full bg-line" />
          </View>
          <View className="mb-3 flex-row items-center justify-between">
            {title ? <Text variant="title" className="text-lg">{title}</Text> : <View />}
            <Pressable onPress={onClose} hitSlop={8}>
              <Text variant="muted">{t.common.close}</Text>
            </Pressable>
          </View>
          {children}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
