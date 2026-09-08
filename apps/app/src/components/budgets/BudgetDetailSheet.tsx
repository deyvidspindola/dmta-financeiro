import { useMemo } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { budgetsApi } from '@/api';
import { Badge, Button, Money, ProgressBar, Sheet, Skeleton, Text } from '@/components/ui';
import { t } from '@/i18n';
import { formatDateShort } from '@/lib/dates';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { BudgetItem, BudgetRow } from '@/types/models';

type Props = {
  budget: BudgetRow | null;
  contextId: string | null;
  month: string;
  onClose: () => void;
  onEdit: () => void;
};

function ItemRow({ item, categoryName }: { item: BudgetItem; categoryName: string }) {
  const showSubcategory = item.category_name !== null && item.category_name !== categoryName;

  return (
    <View
      className={cn(
        'flex-row items-start gap-3 border-b border-line py-3',
        !item.effective && 'opacity-70',
      )}
    >
      <View className="min-w-0 flex-1 gap-0.5">
        <View className="flex-row items-center gap-2">
          <Text className="text-sm" numberOfLines={1}>
            {item.description}
          </Text>
          {!item.effective ? (
            <Badge tone="neutral" className="text-[10px]">
              Previsto
            </Badge>
          ) : null}
        </View>
        <View className="flex-row items-center gap-2">
          <Text variant="muted" className="text-xs">
            {formatDateShort(item.date)}
          </Text>
          {showSubcategory ? (
            <Text variant="muted" className="text-[10px]">
              {item.category_name}
            </Text>
          ) : null}
        </View>
      </View>
      <Money amount={item.amount} size="sm" className={cn(!item.effective && 'text-fg-muted')} />
    </View>
  );
}

function ItemSection({ title, items, categoryName }: { title: string; items: BudgetItem[]; categoryName: string }) {
  if (items.length === 0) return null;

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text variant="muted" className="text-xs uppercase">
          {title}
        </Text>
        <Money amount={total} size="sm" className="text-fg-muted" />
      </View>
      <View>
        {items.map((item, index) => (
          <ItemRow key={`${item.kind}-${item.date}-${index}`} item={item} categoryName={categoryName} />
        ))}
      </View>
    </View>
  );
}

export function BudgetDetailSheet({ budget, contextId, month, onClose, onEdit }: Props) {
  const detailQuery = useQuery({
    queryKey: ['budget-detail', contextId, budget?.budget_id, month],
    queryFn: () => budgetsApi.getBudgetDetail(contextId!, budget!.budget_id, month),
    enabled: Boolean(contextId) && Boolean(budget),
  });

  const detail = detailQuery.data;
  const categoryName = detail?.category_name ?? budget?.category_name ?? '';
  const spent = detail?.spent ?? budget?.spent ?? 0;
  const spentEffective = detail?.spent_effective ?? budget?.spent_effective ?? 0;
  const limit = detail?.limit ?? budget?.limit ?? 0;
  const items = useMemo(() => detail?.items ?? [], [detail]);

  const spentItems = useMemo(() => items.filter((item) => item.effective), [items]);
  const forecastItems = useMemo(() => items.filter((item) => !item.effective), [items]);

  const pct = budget ? Math.min(100, budget.percent) : 0;
  const tone = budget?.over ? 'negative' : pct > 85 ? 'warning' : 'brand';

  return (
    <Sheet open={budget !== null} onClose={onClose} title={t.budgets.detail.title}>
      {budget ? (
        <View className="gap-4">
          <View className="gap-3">
            <Text className="text-lg font-semibold">{categoryName}</Text>
            <ProgressBar value={pct} tone={tone} />
            <View>
              <Text>
                <Money amount={spent} size="sm" />
                <Text variant="muted"> {t.budgets.of} </Text>
                <Money amount={limit} size="sm" className="inline" />
              </Text>
              {spentEffective !== spent ? (
                <Text variant="muted" className="text-xs">
                  {t.budgets.spentEffective(formatMoney(spentEffective))} de {formatMoney(spent)} total
                </Text>
              ) : null}
            </View>
          </View>

          {detailQuery.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : detailQuery.isError ? (
            <Text variant="error">{t.common.error}</Text>
          ) : items.length === 0 ? (
            <Text variant="muted">{t.budgets.detail.emptyConsumption}</Text>
          ) : (
            <View className="gap-6">
              <ItemSection title={t.budgets.detail.sectionSpent} items={spentItems} categoryName={categoryName} />
              <ItemSection title={t.budgets.detail.sectionForecast} items={forecastItems} categoryName={categoryName} />
            </View>
          )}

          <Button
            label={t.budgets.detail.editLimit}
            variant="secondary"
            onPress={() => {
              onClose();
              onEdit();
            }}
          />
        </View>
      ) : null}
    </Sheet>
  );
}
