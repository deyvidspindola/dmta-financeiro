import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { creditCardsApi } from '@/api';
import { TabShell } from '@/components/TabShell';
import { Badge, ListRow, Money, PressableCard, ProgressBar, Sheet, Skeleton, Text } from '@/components/ui';
import { t } from '@/i18n';
import { formatDateShort, formatMonthLabel } from '@/lib/dates';
import { CONSOLIDATED, useAuthStore } from '@/store/authStore';
import type { CreditCard, InvoiceStatus } from '@/types/models';

const INVOICE_TONE: Record<InvoiceStatus, 'neutral' | 'accent' | 'brand'> = {
  open: 'brand',
  closed: 'accent',
  paid: 'neutral',
};

function CardRow({ card, onPress }: { card: CreditCard; onPress: () => void }) {
  const used = card.limit > 0 ? Math.min(100, ((card.limit - (card.available_limit ?? card.limit)) / card.limit) * 100) : 0;
  return (
    <PressableCard onPress={onPress} className="gap-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="font-semibold" numberOfLines={1}>
            {card.name}
          </Text>
          <Text variant="muted" className="text-xs">
            {card.brand ?? t.creditCards.cycle(card.closing_day, card.due_day)}
          </Text>
        </View>
        <View className="items-end">
          <Text variant="muted" className="text-xs">
            {t.creditCards.currentInvoice}
          </Text>
          <Money amount={card.current_invoice_total} size="sm" />
        </View>
      </View>

      {card.limit > 0 ? (
        <View className="gap-1">
          <ProgressBar value={used} tone={used > 90 ? 'negative' : 'brand'} />
          <View className="flex-row justify-between">
            <Text variant="muted" className="text-xs">
              {t.creditCards.available}: {card.available_limit != null ? formatBRL(card.available_limit) : '—'}
            </Text>
            <Text variant="muted" className="text-xs">
              {t.creditCards.limit}: {formatBRL(card.limit)}
            </Text>
          </View>
        </View>
      ) : (
        <Text variant="muted" className="text-xs">
          {t.creditCards.noLimit}
        </Text>
      )}
    </PressableCard>
  );
}

function formatBRL(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

export default function CardsTab() {
  const activeScope = useAuthStore((s) => s.activeScope);
  const contexts = useAuthStore((s) => s.contexts);
  const isConsolidated = activeScope === CONSOLIDATED;
  const [selected, setSelected] = useState<CreditCard | null>(null);

  const cardsQuery = useQuery({
    queryKey: ['credit-cards', activeScope],
    queryFn: () =>
      isConsolidated
        ? creditCardsApi.listConsolidatedCreditCards()
        : creditCardsApi.listCreditCards(activeScope),
    enabled: Boolean(activeScope),
  });

  const invoicesQuery = useQuery({
    queryKey: ['card-invoices', selected?.context_id, selected?.id],
    queryFn: () => creditCardsApi.listCardInvoices(selected!.context_id, selected!.id),
    enabled: selected !== null && Boolean(selected?.context_id),
  });

  const contextName = useMemo(
    () => (id: string) => contexts.find((c) => c.id === id)?.name ?? '',
    [contexts],
  );

  return (
    <TabShell title={t.creditCards.title}>
      {cardsQuery.isLoading ? (
        <View className="gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </View>
      ) : cardsQuery.isError ? (
        <Text variant="error">{t.common.error}</Text>
      ) : (cardsQuery.data ?? []).length === 0 ? (
        <Text variant="muted">{t.creditCards.empty}</Text>
      ) : (
        <View className="gap-3">
          {(cardsQuery.data ?? []).map((card) => (
            <View key={`${card.context_id}-${card.id}`} className="gap-1">
              {isConsolidated ? (
                <Badge tone="neutral">{contextName(card.context_id)}</Badge>
              ) : null}
              <CardRow card={card} onPress={() => setSelected(card)} />
            </View>
          ))}
        </View>
      )}

      <Sheet open={selected !== null} onClose={() => setSelected(null)} title={selected?.name}>
        <Text variant="muted" className="mb-2 text-xs">
          {selected ? t.creditCards.cycle(selected.closing_day, selected.due_day) : ''}
        </Text>
        <Text variant="label" className="mb-1">
          {t.creditCards.invoices}
        </Text>
        {invoicesQuery.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (invoicesQuery.data ?? []).length === 0 ? (
          <Text variant="muted">{t.creditCards.noInvoices}</Text>
        ) : (
          <View>
            {(invoicesQuery.data ?? []).map((invoice) => (
              <ListRow key={invoice.id}>
                <View className="flex-row items-center justify-between gap-3">
                  <View className="gap-0.5">
                    <Text className="font-medium">{formatMonthLabel(invoice.reference_month.slice(0, 7))}</Text>
                    <View className="flex-row items-center gap-2">
                      <Badge tone={INVOICE_TONE[invoice.status]}>
                        {t.creditCards.statuses[invoice.status]}
                      </Badge>
                      <Text variant="muted" className="text-xs">
                        {t.creditCards.dueOn} {formatDateShort(invoice.due_date)}
                      </Text>
                    </View>
                  </View>
                  <Money amount={invoice.amount} size="sm" />
                </View>
              </ListRow>
            ))}
          </View>
        )}
      </Sheet>
    </TabShell>
  );
}
