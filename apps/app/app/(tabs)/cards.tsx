import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { creditCardsApi } from '@/api';
import { ApiError } from '@/api/http';
import { TabShell } from '@/components/TabShell';
import { CardDetailSheet } from '@/components/creditCards/CardDetailSheet';
import {
  Badge,
  Button,
  Money,
  MoneyField,
  PressableCard,
  ProgressBar,
  Sheet,
  Skeleton,
  Text,
  TextField,
} from '@/components/ui';
import { t } from '@/i18n';
import { CONSOLIDATED, useAuthStore } from '@/store/authStore';
import type { CreditCard } from '@/types/models';

type FormState = {
  id: string | null;
  name: string;
  brand: string;
  limit: number;
  closingDay: string;
  dueDay: string;
};
const EMPTY_FORM: FormState = {
  id: null,
  name: '',
  brand: '',
  limit: 0,
  closingDay: '5',
  dueDay: '12',
};

function CardRow({ card, onPress }: { card: CreditCard; onPress: () => void }) {
  const used =
    card.limit > 0
      ? Math.min(100, ((card.limit - (card.available_limit ?? card.limit)) / card.limit) * 100)
      : 0;
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
              {t.creditCards.available}:{' '}
              {card.available_limit != null ? formatBRL(card.available_limit) : '—'}
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
  const queryClient = useQueryClient();
  const activeScope = useAuthStore((s) => s.activeScope);
  const contexts = useAuthStore((s) => s.contexts);
  const isConsolidated = activeScope === CONSOLIDATED;
  const [selected, setSelected] = useState<CreditCard | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const cardsQuery = useQuery({
    queryKey: ['credit-cards', activeScope],
    queryFn: () =>
      isConsolidated
        ? creditCardsApi.listConsolidatedCreditCards()
        : creditCardsApi.listCreditCards(activeScope),
    enabled: Boolean(activeScope),
  });

  const contextName = useMemo(
    () => (id: string) => contexts.find((c) => c.id === id)?.name ?? '',
    [contexts],
  );

  const save = useMutation({
    mutationFn: (f: FormState) => {
      const body = {
        name: f.name.trim(),
        brand: f.brand.trim() || null,
        limit: f.limit,
        closing_day: Number(f.closingDay),
        due_day: Number(f.dueDay),
      };
      return f.id
        ? creditCardsApi.updateCreditCard(activeScope, f.id, body)
        : creditCardsApi.createCreditCard(activeScope, body);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['credit-cards'] });
      setForm(null);
    },
    onError: (err) =>
      setFormError(err instanceof ApiError && err.message ? err.message : t.common.error),
  });

  function openEdit(card: CreditCard) {
    setSelected(null);
    setForm({
      id: card.id,
      name: card.name,
      brand: card.brand ?? '',
      limit: card.limit,
      closingDay: String(card.closing_day),
      dueDay: String(card.due_day),
    });
  }

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
              {isConsolidated ? <Badge tone="neutral">{contextName(card.context_id)}</Badge> : null}
              <CardRow card={card} onPress={() => setSelected(card)} />
            </View>
          ))}
        </View>
      )}

      {!isConsolidated ? (
        <Button
          label={t.creditCards.create}
          variant="secondary"
          className="mt-3"
          onPress={() => setForm({ ...EMPTY_FORM })}
        />
      ) : null}

      <CardDetailSheet card={selected} onClose={() => setSelected(null)} onEdit={openEdit} />

      <Sheet
        open={form !== null}
        onClose={() => {
          setForm(null);
          setFormError(null);
        }}
        title={form?.id ? t.creditCards.edit : t.creditCards.create}
      >
        {form ? (
          <View className="gap-4">
            <TextField
              label={t.creditCards.name}
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
            />
            <TextField
              label={t.creditCards.brand}
              value={form.brand}
              onChangeText={(v) => setForm({ ...form, brand: v })}
            />
            <MoneyField
              label={t.creditCards.limit}
              value={form.limit}
              onChange={(v) => setForm({ ...form, limit: v })}
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <TextField
                  label={t.creditCards.closingDay}
                  value={form.closingDay}
                  onChangeText={(v) => setForm({ ...form, closingDay: v.replace(/\D/g, '') })}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
              <View className="flex-1">
                <TextField
                  label={t.creditCards.dueDay}
                  value={form.dueDay}
                  onChangeText={(v) => setForm({ ...form, dueDay: v.replace(/\D/g, '') })}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
            </View>

            {formError ? <Text variant="error">{formError}</Text> : null}

            <Button
              label={t.common.save}
              loading={save.isPending}
              disabled={
                !form.name.trim() ||
                !form.closingDay ||
                !form.dueDay ||
                Number(form.closingDay) < 1 ||
                Number(form.closingDay) > 31 ||
                Number(form.dueDay) < 1 ||
                Number(form.dueDay) > 31
              }
              onPress={() => {
                setFormError(null);
                save.mutate(form);
              }}
            />
          </View>
        ) : null}
      </Sheet>
    </TabShell>
  );
}
