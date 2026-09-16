import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountsApi } from '@/api';
import { ApiError } from '@/api/http';
import {
  AccountIcon,
  Money,
  MoneyField,
  Screen,
  SelectField,
  Skeleton,
  SwitchField,
  Text,
  TextField,
} from '@/components/ui';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { ACCOUNT_COLOR_OPTIONS, accountColor } from '@/lib/accountColor';
import { useSessionRoute } from '@/hooks/useSessionRoute';
import type { AccountType } from '@/types/models';

const TYPE_OPTIONS = (['checking', 'savings', 'wallet', 'other'] as AccountType[]).map((v) => ({
  value: v,
  label: t.accounts.types[v],
}));

type FormState = {
  name: string;
  bank: string;
  type: AccountType;
  balance: number;
  includeInDashboard: boolean;
  color: string | null;
};

export default function AccountEditScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionRoute = useSessionRoute();
  const { id, contextId } = useLocalSearchParams<{ id?: string; contextId: string }>();

  const [formError, setFormError] = useState<string | null>(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  const accountsQuery = useQuery({
    queryKey: ['accounts', contextId],
    queryFn: () => accountsApi.listAccounts(contextId),
    enabled: Boolean(contextId) && Boolean(id),
  });
  const account = id ? (accountsQuery.data?.find((a) => a.id === id) ?? null) : null;

  const [form, setForm] = useState<FormState>({
    name: account?.name ?? '',
    bank: account?.bank_name ?? '',
    type: account?.type ?? 'checking',
    balance: account?.balance ?? 0,
    includeInDashboard: account?.include_in_dashboard ?? true,
    color: account?.color ?? null,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['accounts'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const save = useMutation({
    mutationFn: () => {
      const base = {
        name: form.name.trim(),
        bank_name: form.bank.trim() || null,
        type: form.type,
        include_in_dashboard: form.includeInDashboard,
        color: form.color,
      };
      return id
        ? accountsApi.updateAccount(contextId, id, base)
        : accountsApi.createAccount(contextId, { ...base, balance: form.balance });
    },
    onSuccess: () => {
      invalidate();
      router.back();
    },
    onError: (err) =>
      setFormError(err instanceof ApiError && err.message ? err.message : t.common.error),
  });

  if (sessionRoute !== '/(tabs)') return <Redirect href={sessionRoute} />;

  // Quando está carregando a conta para editar
  if (id && accountsQuery.isLoading) {
    return (
      <Screen>
        <View className="mb-4 flex-row items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={24} color="#7c918b" />
          </Pressable>
        </View>
        <View className="gap-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </View>
      </Screen>
    );
  }

  // Conta não encontrada
  if (id && !account) {
    return (
      <Screen>
        <View className="mb-4 flex-row items-center justify-between">
          <Text variant="title">{t.accounts.edit}</Text>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={24} color="#7c918b" />
          </Pressable>
        </View>
        <Text variant="error">{t.accountDetail.notFound}</Text>
      </Screen>
    );
  }

  const currentColor = accountColor(form.color);

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-24"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-4 flex-row items-center justify-between">
          <Text variant="title">{id ? t.accounts.edit : t.accounts.create}</Text>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={24} color="#7c918b" />
          </Pressable>
        </View>

        {/* Saldo atual da conta (só em edição) */}
        {id && account ? (
          <View className="mb-4">
            <Text variant="muted" className="mb-1 text-xs">
              {t.accounts.currentBalance}
            </Text>
            <Money amount={account.balance} size="xl" className="font-semibold" />
          </View>
        ) : null}

        <View className="gap-4">
          {/* Banco/Instituição com ícone */}
          <Pressable
            onPress={() => setColorPickerOpen(true)}
            className="flex-row items-center justify-between rounded-2xl border border-line bg-surface p-4 active:opacity-70"
          >
            <View className="flex-row items-center gap-3">
              <View
                className="h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: currentColor }}
              >
                <AccountIcon type={form.type} size="sm" />
              </View>
              <Text className="font-medium">{form.bank || t.accounts.bankName}</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#7c918b" />
          </Pressable>

          {/* Nome da conta */}
          <TextField
            label={t.accounts.name}
            value={form.name}
            onChangeText={(v) => setForm({ ...form, name: v })}
            placeholder={t.accounts.namePlaceholder}
          />

          {/* Banco */}
          <TextField
            label={t.accounts.bankName}
            value={form.bank}
            onChangeText={(v) => setForm({ ...form, bank: v })}
            placeholder={t.accounts.bankNamePlaceholder}
          />

          {/* Tipo da conta */}
          <SelectField
            label={t.accounts.type}
            placeholder={t.common.select}
            value={form.type}
            options={TYPE_OPTIONS}
            onChange={(v) => setForm({ ...form, type: v as AccountType })}
          />

          {/* Cor da conta */}
          <Pressable
            onPress={() => setColorPickerOpen(true)}
            className="rounded-2xl border border-line bg-surface p-4 active:opacity-70"
          >
            <View className="mb-2 flex-row items-center justify-between">
              <Text variant="muted" className="text-xs">
                {t.accounts.accountColor}
              </Text>
              <View
                className="h-6 w-6 rounded-full border border-line"
                style={{ backgroundColor: currentColor }}
              />
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="font-medium">
                {form.color
                  ? (ACCOUNT_COLOR_OPTIONS.find((c) => c.name === form.color)?.name ??
                    t.accounts.defaultColor)
                  : t.accounts.defaultColor}
              </Text>
              <Feather name="chevron-right" size={20} color="#7c918b" />
            </View>
          </Pressable>

          {/* Toggle incluir na soma da tela inicial */}
          <View className="rounded-2xl border border-line bg-surface p-4">
            <SwitchField
              label={t.accounts.includeInDashboard}
              value={form.includeInDashboard}
              onChange={(v) => setForm({ ...form, includeInDashboard: v })}
            />
          </View>

          {/* Saldo inicial (só em criação) */}
          {!id && (
            <MoneyField
              label={t.accounts.balance}
              value={form.balance}
              onChange={(v) => setForm({ ...form, balance: v })}
            />
          )}

          {id && (
            <Text variant="muted" className="text-xs">
              {t.accounts.balanceEditHint}
            </Text>
          )}

          {formError ? <Text variant="error">{formError}</Text> : null}
        </View>
      </ScrollView>

      {/* FAB de confirmar */}
      <Pressable
        onPress={() => {
          setFormError(null);
          save.mutate();
        }}
        disabled={!form.name.trim() || save.isPending}
        className={cn(
          'absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full shadow-lg',
          !form.name.trim() || save.isPending ? 'bg-fg-muted' : 'bg-negative active:opacity-80',
        )}
      >
        <Feather name="check" size={24} color="#ffffff" />
      </Pressable>

      {/* Sheet de seleção de cor */}
      {colorPickerOpen && (
        <View className="absolute inset-0 items-center justify-end bg-black/50">
          <Pressable onPress={() => setColorPickerOpen(false)} className="absolute inset-0" />
          <View className="w-full rounded-t-3xl bg-surface p-6">
            <View className="mb-4 flex-row items-center justify-between">
              <Text variant="title" className="text-lg">
                {t.accounts.selectColor}
              </Text>
              <Pressable onPress={() => setColorPickerOpen(false)} hitSlop={8}>
                <Feather name="x" size={24} color="#7c918b" />
              </Pressable>
            </View>
            <View className="flex-row flex-wrap gap-3">
              {ACCOUNT_COLOR_OPTIONS.map((colorOption) => (
                <Pressable
                  key={colorOption.name}
                  onPress={() => {
                    setForm({ ...form, color: colorOption.name });
                    setColorPickerOpen(false);
                  }}
                  className="items-center justify-center active:opacity-70"
                >
                  <View
                    className={cn(
                      'h-12 w-12 items-center justify-center rounded-full',
                      form.color === colorOption.name && 'border-4 border-brand-600',
                    )}
                    style={{ backgroundColor: colorOption.hex }}
                  >
                    {form.color === colorOption.name && (
                      <Feather name="check" size={20} color="#ffffff" />
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      )}
    </Screen>
  );
}
