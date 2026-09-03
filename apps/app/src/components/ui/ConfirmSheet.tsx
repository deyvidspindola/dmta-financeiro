import { View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { t } from '@/i18n';

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  tone?: 'primary' | 'danger';
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

/** Confirmação no lugar do alert nativo — usada antes de excluir/ações irreversíveis. */
export function ConfirmSheet({
  open,
  title,
  message,
  confirmLabel,
  tone = 'primary',
  loading = false,
  onConfirm,
  onClose,
}: Props) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <Text variant="muted" className="mb-4">
        {message}
      </Text>
      <View className="flex-row justify-end gap-2">
        <Button label={t.common.cancel} variant="ghost" onPress={onClose} className="px-4" />
        <Button
          label={confirmLabel}
          variant={tone === 'danger' ? 'primary' : 'primary'}
          loading={loading}
          onPress={onConfirm}
          className={tone === 'danger' ? 'bg-negative active:bg-negative px-4' : 'px-4'}
        />
      </View>
    </Sheet>
  );
}
