import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi } from '@/api';
import { Badge, Button, MoneyValue, Sheet, Text } from '@/components/ui';
import { t } from '@/i18n';
import { formatDateShort } from '@/lib/dates';
import { transactionDirection } from '@/lib/transactionDisplay';
import type { StatementEntry } from '@/types/models';

type Props = {
  entry: StatementEntry | null;
  contextId: string | null;
  accountName?: string;
  categoryName?: string;
  onClose: () => void;
};

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="flex-row items-start justify-between gap-4 border-b border-line py-3">
      <Text variant="muted">{label}</Text>
      <View className="flex-1 items-end">{children}</View>
    </View>
  );
}

/** Detalhe de um lançamento — abre em sheet a partir da lista. Efetivar previsto no B2. */
export function TransactionDetailSheet({ entry, contextId, accountName, categoryName, onClose }: Props) {
  const queryClient = useQueryClient();

  const settle = useMutation({
    mutationFn: () => transactionsApi.settleTransaction(contextId!, entry!.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['accounts'] });
      onClose();
    },
  });

  const tags: string[] = [];
  if (entry?.bill_id) tags.push(t.transactions.detail.fromBill);
  if (entry?.card_invoice_id) tags.push(t.transactions.detail.fromCard);
  if (entry?.recurring_transaction_id) tags.push(t.transactions.detail.fromRecurring);
  if (entry?.goal_id) tags.push(t.transactions.detail.toGoal);
  if (entry?.transfer_pair_id) tags.push(t.transactions.detail.transfer);

  const isPending = entry?.status === 'pending';

  return (
    <Sheet open={entry !== null} onClose={onClose} title={t.transactions.detail.title}>
      {entry ? (
        <View>
          <View className="mb-2 gap-1">
            <View className="flex-row items-center gap-2">
              <Text variant="title" className="text-lg" numberOfLines={2}>
                {entry.description}
              </Text>
              {isPending ? <Badge tone="accent">{t.transactions.pendingBadge}</Badge> : null}
            </View>
            <MoneyValue
              amount={entry.amount}
              direction={transactionDirection(entry)}
              size="xl"
            />
          </View>

          <Row label={t.transactions.type}>
            <Text>{t.transactions.types[entry.type]}</Text>
          </Row>
          <Row label={t.transactions.date}>
            <Text>{formatDateShort(entry.date)}</Text>
          </Row>
          <Row label={t.transactions.account}>
            <Text numberOfLines={1}>{accountName ?? '—'}</Text>
          </Row>
          <Row label={t.transactions.category}>
            <Text numberOfLines={1}>{categoryName ?? '—'}</Text>
          </Row>
          <Row label={t.billCaptures.origin}>
            <Text>{t.origin[entry.origin]}</Text>
          </Row>

          {tags.length > 0 ? (
            <View className="mt-3 flex-row flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} tone="neutral">
                  {tag}
                </Badge>
              ))}
            </View>
          ) : null}

          {isPending && contextId ? (
            <View className="mt-4 gap-2">
              {settle.isError ? (
                <Text variant="error">{t.transactions.detail.settleError}</Text>
              ) : null}
              <Button
                label={t.transactions.detail.markSettled}
                loading={settle.isPending}
                onPress={() => settle.mutate()}
              />
            </View>
          ) : entry.settled_at ? (
            <Text variant="muted" className="mt-4 text-xs text-fg-subtle">
              {t.transactions.detail.settledOn(formatDateShort(entry.settled_at.slice(0, 10)))}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Sheet>
  );
}
