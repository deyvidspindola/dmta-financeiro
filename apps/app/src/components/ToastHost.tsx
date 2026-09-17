import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import { useToastStore, type ToastTone } from '@/store/toastStore';

const TONE_STYLE: Record<ToastTone, string> = {
  success: 'bg-positive',
  error: 'bg-negative',
};

/**
 * Desenha a fila de `useToastStore` na tela. Sem isso, `push()` só
 * altera o estado da store — nada aparece pro usuário, porque a store
 * nunca teve um lugar que a lesse pra renderizar (bug real, corrigido
 * aqui). Fica montado uma vez em `_layout.tsx`, funciona em toda rota.
 */
export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View
      className="absolute inset-x-0 bottom-0 z-40 gap-2 px-4"
      style={{ paddingBottom: insets.bottom + 12, pointerEvents: 'box-none' }}
    >
      {toasts.map((toast) => (
        <Pressable
          key={toast.id}
          onPress={() => dismiss(toast.id)}
          className={`rounded-xl px-4 py-3 ${TONE_STYLE[toast.tone]}`}
        >
          <Text className="text-sm font-medium text-white">{toast.message}</Text>
        </Pressable>
      ))}
    </View>
  );
}
