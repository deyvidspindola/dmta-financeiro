import { View } from 'react-native';
import type { RecurrenceEditScope } from '@/api/transactions';
import { Button, Sheet, Text } from '@/components/ui';
import { t } from '@/i18n';

type Props = {
  open: boolean;
  action: 'edit' | 'delete';
  onChoose: (scope: RecurrenceEditScope) => void;
  onClose: () => void;
};

/**
 * "Só este / este e os futuros / todos" — pedido quando a edição/exclusão
 * é num lançamento que veio de uma recorrência (mesmo padrão de agenda:
 * Google Calendar). Fora daqui, edição/exclusão avulsa continua o
 * ConfirmSheet de sempre.
 */
export function RecurrenceScopeSheet({ open, action, onChoose, onClose }: Props) {
  const s = t.transactions.scopeSheet;
  const isDelete = action === 'delete';

  return (
    <Sheet open={open} onClose={onClose} title={isDelete ? s.deleteTitle : s.editTitle}>
      <Text variant="muted" className="mb-4">
        {isDelete ? s.deleteMessage : s.editMessage}
      </Text>
      <View className="gap-2">
        <Button label={s.this} variant="secondary" onPress={() => onChoose('this')} />
        <Button label={s.future} variant="secondary" onPress={() => onChoose('future')} />
        <Button
          label={s.all}
          variant="secondary"
          className={isDelete ? 'bg-negative active:bg-negative' : undefined}
          onPress={() => onChoose('all')}
        />
        <Text variant="muted" className="text-xs">
          {s.allHint}
        </Text>
      </View>
      <View className="mt-4 flex-row justify-end">
        <Button label={t.common.cancel} variant="ghost" onPress={onClose} />
      </View>
    </Sheet>
  );
}
