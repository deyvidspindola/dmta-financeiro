import { useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountsApi, billsApi, categoriesApi } from '@/api';
import { ApiError } from '@/api/http';
import {
  Badge,
  Button,
  CategoryIcon,
  ConfirmSheet,
  DateField,
  ListRow,
  MoneyField,
  MoneyValue,
  Screen,
  SelectField,
  Sheet,
  Skeleton,
  Text,
  TextField,
} from '@/components/ui';
import { t } from '@/i18n';
import { formatDateShort, formatMonthLabel, monthDateRange } from '@/lib/dates';
import { useSessionRoute } from '@/hooks/useSessionRoute';
import { CONSOLIDATED, useAuthStore } from '@/store/authStore';
import { useMonthStore } from '@/store/monthStore';
import { useScanStore } from '@/store/scanStore';
import type { Bill, BillKind, BillStatus } from '@/types/models';

// Mesma paleta do apps/web (billStatusTone): pago=verde, vencido=vermelho,
// pendente=âmbar — antes o mobile não tinha tom vermelho/âmbar no Badge e
// usava roxo genérico pra "vencido", perdendo o sinal de urgência.
const STATUS_TONE: Record<BillStatus, 'neutral' | 'brand' | 'negative' | 'warning'> = {
  pending: 'warning',
  overdue: 'negative',
  paid: 'brand',
  cancelled: 'neutral',
};

type FormState = {
  id: string | null;
  description: string;
  amount: number;
  dueDate: string;
  kind: BillKind;
  categoryId: string | null;
  barcode: string;
};

export default function BillsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionRoute = useSessionRoute();
  const activeScope = useAuthStore((s) => s.activeScope);
  const month = useMonthStore((s) => s.month);
  const isConsolidated = activeScope === CONSOLIDATED;

  const [form, setForm] = useState<FormState | null>(null);
  const [payFor, setPayFor] = useState<Bill | null>(null);
  const [payAccountId, setPayAccountId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Bill | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { from, to } = monthDateRange(month);

  const billsQuery = useQuery({
    queryKey: ['bills', activeScope, month],
    queryFn: () => billsApi.listBills(activeScope, { from, to }),
    enabled: !isConsolidated && Boolean(activeScope),
  });

  const accountsQuery = useQuery({
    queryKey: ['accounts', activeScope],
    queryFn: () => accountsApi.listAccounts(activeScope),
    enabled: payFor !== null && Boolean(activeScope),
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories', activeScope, form?.kind === 'receivable' ? 'income' : 'expense'],
    queryFn: () =>
      categoriesApi.listCategories(activeScope, {
        type: form?.kind === 'receivable' ? 'income' : 'expense',
      }),
    enabled: form !== null && Boolean(activeScope),
  });

  // Nomes de categoria pras linhas da lista (payable + receivable
  // misturados) — independente do `categoriesQuery` acima, que é filtrado
  // pelo tipo do formulário aberto.
  const allCategoriesQuery = useQuery({
    queryKey: ['categories', activeScope, 'all'],
    queryFn: async () => {
      const [expense, income] = await Promise.all([
        categoriesApi.listCategories(activeScope, { type: 'expense' }),
        categoriesApi.listCategories(activeScope, { type: 'income' }),
      ]);
      return [...expense, ...income];
    },
    enabled: !isConsolidated && Boolean(activeScope),
  });

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of allCategoriesQuery.data ?? []) map.set(c.id, c.name);
    return map;
  }, [allCategoriesQuery.data]);

  const accountOptions = useMemo(
    () => (accountsQuery.data ?? []).map((a) => ({ value: a.id, label: a.name })),
    [accountsQuery.data],
  );
  const categoryOptions = useMemo(
    () => [
      { value: '', label: t.bills.category },
      ...(categoriesQuery.data ?? []).map((c) => ({ value: c.id, label: c.name })),
    ],
    [categoriesQuery.data],
  );

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['bills'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    void queryClient.invalidateQueries({ queryKey: ['transactions'] });
    void queryClient.invalidateQueries({ queryKey: ['accounts'] });
  };

  const save = useMutation({
    mutationFn: (f: FormState) => {
      const base = {
        description: f.description.trim(),
        amount: f.amount,
        due_date: f.dueDate,
        category_id: f.categoryId || null,
        barcode: f.barcode.trim() || null,
      };
      return f.id
        ? billsApi.updateBill(activeScope, f.id, base)
        : billsApi.createBill(activeScope, { ...base, kind: f.kind });
    },
    onSuccess: () => {
      invalidate();
      setForm(null);
    },
    onError: (err) =>
      setFormError(err instanceof ApiError && err.message ? err.message : t.common.error),
  });

  const pay = useMutation({
    mutationFn: (bill: Bill) => billsApi.payBill(activeScope, bill.id, payAccountId!),
    onSuccess: () => {
      invalidate();
      setPayFor(null);
      setPayAccountId(null);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => billsApi.deleteBill(activeScope, id),
    onSuccess: () => {
      invalidate();
      setToDelete(null);
    },
    onError: () => setToDelete(null),
  });

  const consumeScan = useScanStore((s) => s.consume);

  useFocusEffect(
    useCallback(() => {
      const scan = consumeScan();
      if (!scan) return;
      setForm({
        id: null,
        description: scan.description ?? '',
        amount: scan.amount ?? 0,
        dueDate: scan.dueDate ?? new Date().toISOString().slice(0, 10),
        kind: 'payable',
        categoryId: null,
        barcode: scan.barcode ?? scan.pixCode ?? '',
      });
    }, [consumeScan]),
  );

  if (sessionRoute !== '/(tabs)') return <Redirect href={sessionRoute} />;

  return (
    <Screen scroll>
      <View className="mb-1 flex-row items-center justify-between">
        <Text variant="title">{t.bills.title}</Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text variant="muted">{t.common.close}</Text>
        </Pressable>
      </View>
      <Text variant="muted" className="mb-4 text-xs">
        {formatMonthLabel(month)}
      </Text>

      {isConsolidated ? (
        <Text variant="muted">{t.debts.needContext}</Text>
      ) : billsQuery.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : billsQuery.isError ? (
        <Text variant="error">{t.common.error}</Text>
      ) : (
        <View className="gap-4">
          {(billsQuery.data ?? []).length === 0 ? (
            <Text variant="muted">{t.bills.emptyMonth}</Text>
          ) : (
            <View className="rounded-2xl border border-line bg-surface">
              {(billsQuery.data ?? []).map((bill) => (
                <ListRow
                  key={bill.id}
                  onPress={() =>
                    setForm({
                      id: bill.id,
                      description: bill.description,
                      amount: bill.amount,
                      dueDate: bill.due_date,
                      kind: bill.kind,
                      categoryId: bill.category_id,
                      barcode: bill.barcode ?? '',
                    })
                  }
                  leading={
                    <CategoryIcon
                      categoryId={bill.category_id}
                      name={
                        bill.category_id
                          ? (categoryMap.get(bill.category_id) ?? '')
                          : t.newTransaction.categoryNone
                      }
                      size="sm"
                    />
                  }
                >
                  <View className="flex-row items-center justify-between gap-3">
                    <View className="min-w-0 flex-1 gap-0.5">
                      <Text className="font-medium" numberOfLines={1}>
                        {bill.description}
                      </Text>
                      <View className="flex-row items-center gap-2">
                        <Badge tone={STATUS_TONE[bill.status]}>
                          {t.bills.statuses[bill.status]}
                        </Badge>
                        <Text variant="muted" className="text-xs">
                          {formatDateShort(bill.due_date)}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end gap-1">
                      <MoneyValue
                        amount={bill.amount}
                        direction={bill.kind === 'receivable' ? 'credit' : 'debit'}
                        size="sm"
                      />
                      {bill.status === 'pending' || bill.status === 'overdue' ? (
                        <Pressable
                          onPress={() => {
                            setPayFor(bill);
                            setPayAccountId(null);
                          }}
                          className="rounded-lg bg-brand-500/15 px-2 py-1 active:bg-brand-500/25"
                        >
                          <Text className="text-[10px] font-medium text-brand-700 dark:text-brand-300">
                            {t.bills.pay}
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                </ListRow>
              ))}
            </View>
          )}

          <View className="gap-2">
            <Button
              label={t.bills.create}
              onPress={() =>
                setForm({
                  id: null,
                  description: '',
                  amount: 0,
                  dueDate: new Date().toISOString().slice(0, 10),
                  kind: 'payable',
                  categoryId: null,
                  barcode: '',
                })
              }
            />
            <Button
              label={t.bills.scan}
              variant="ghost"
              onPress={() => router.push('/scan-boleto')}
            />
          </View>
        </View>
      )}

      {/* Form */}
      <Sheet
        open={form !== null}
        onClose={() => {
          setForm(null);
          setFormError(null);
        }}
        title={form?.id ? t.bills.edit : t.bills.create}
      >
        {form ? (
          <View className="gap-4">
            {form.id ? (
              <Badge tone="neutral">{t.bills.kinds[form.kind]}</Badge>
            ) : (
              <SelectField
                label={t.bills.kind}
                placeholder={t.common.select}
                value={form.kind}
                options={(['payable', 'receivable'] as BillKind[]).map((v) => ({
                  value: v,
                  label: t.bills.kinds[v],
                }))}
                onChange={(v) => setForm({ ...form, kind: v as BillKind, categoryId: null })}
              />
            )}
            <TextField
              label={t.bills.description}
              value={form.description}
              onChangeText={(v) => setForm({ ...form, description: v })}
            />
            <MoneyField
              label={t.bills.amount}
              value={form.amount}
              onChange={(v) => setForm({ ...form, amount: v })}
            />
            <DateField
              label={t.bills.dueDate}
              value={form.dueDate}
              onChange={(v) => setForm({ ...form, dueDate: v })}
            />
            <SelectField
              label={t.bills.category}
              placeholder={t.bills.category}
              value={form.categoryId ?? ''}
              options={categoryOptions}
              onChange={(v) => setForm({ ...form, categoryId: v || null })}
              renderIcon={(opt) => (
                <CategoryIcon categoryId={opt.value || null} name={opt.label} size="sm" />
              )}
            />
            <TextField
              label={t.bills.barcode}
              value={form.barcode}
              onChangeText={(v) => setForm({ ...form, barcode: v })}
              autoCapitalize="none"
            />

            {form.barcode.trim() && !form.id ? (
              <Text variant="muted" className="text-xs">
                {t.bills.scanFilled}
              </Text>
            ) : null}

            {formError ? <Text variant="error">{formError}</Text> : null}

            <View className="flex-row justify-between gap-2">
              {form.id ? (
                <Button
                  label={t.common.delete}
                  variant="ghost"
                  onPress={() => {
                    const b = billsQuery.data?.find((x) => x.id === form.id) ?? null;
                    setForm(null);
                    setToDelete(b);
                  }}
                />
              ) : (
                <View />
              )}
              <Button
                label={t.common.save}
                loading={save.isPending}
                disabled={!form.description.trim() || form.amount <= 0 || !form.dueDate}
                onPress={() => {
                  setFormError(null);
                  save.mutate(form);
                }}
              />
            </View>
          </View>
        ) : null}
      </Sheet>

      {/* Pagar */}
      <Sheet open={payFor !== null} onClose={() => setPayFor(null)} title={t.bills.payTitle}>
        {payFor ? (
          <View className="gap-4">
            <Text variant="muted">{payFor.description}</Text>
            <SelectField
              label={t.bills.payAccount}
              placeholder={t.newTransaction.accountPlaceholder}
              value={payAccountId}
              options={accountOptions}
              onChange={setPayAccountId}
            />
            {pay.isError ? <Text variant="error">{t.common.error}</Text> : null}
            <Button
              label={t.bills.pay}
              loading={pay.isPending}
              disabled={!payAccountId}
              onPress={() => pay.mutate(payFor)}
            />
          </View>
        ) : null}
      </Sheet>

      <ConfirmSheet
        open={toDelete !== null}
        title={t.bills.edit}
        message={t.bills.confirmDelete}
        confirmLabel={t.common.delete}
        tone="danger"
        loading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        onClose={() => setToDelete(null)}
      />
    </Screen>
  );
}
