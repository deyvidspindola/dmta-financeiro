import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import {
  accountsApi,
  categoriesApi,
  recurringTransactionsApi,
  transactionsApi,
  transfersApi,
} from '@/api';
import { ApiError } from '@/api/http';
import { ContextSwitcher } from '@/components/ContextSwitcher';
import {
  AccountIcon,
  AmountHero,
  CategoryIcon,
  QuickDateField,
  SelectField,
  SwitchField,
  Text,
  TextField,
} from '@/components/ui';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { useSessionRoute } from '@/hooks/useSessionRoute';
import { CONSOLIDATED, useAuthStore } from '@/store/authStore';
import { toastSuccess } from '@/store/toastStore';
import type { AccountType } from '@/types/models';

type EntryType = 'income' | 'expense' | 'transfer';

// Cor por tipo — despesa vermelho, receita verde, transferência roxo
// (mesma paleta do leque do FAB). `bg` usa a cor literal da paleta
// (`bg-red-500/10`), não o token semântico (`bg-negative/10`): NativeWind
// resolve opacidade em tempo de build e não sabe calcular alfa sobre uma
// cor vinda de var(--negative) — o fundo simplesmente não aparecia, só o
// texto (cor sólida) funcionava. `hex` é usado em `style` (teclado
// calculadora, botão flutuante), onde classe Tailwind não chega.
const TYPE_TONE: Record<EntryType, { bg: string; solidBg: string; text: string; hex: string }> = {
  expense: { bg: 'bg-red-500/10', solidBg: 'bg-red-500', text: 'text-negative', hex: '#dc2626' },
  income: {
    bg: 'bg-emerald-500/10',
    solidBg: 'bg-emerald-500',
    text: 'text-positive',
    hex: '#059669',
  },
  transfer: {
    bg: 'bg-accent-500/10',
    solidBg: 'bg-accent-500',
    text: 'text-accent-600 dark:text-accent-400',
    hex: '#7c3aed',
  },
};

const schema = z.object({
  amount: z.number().positive(),
  description: z.string().trim().min(1),
  account_id: z.string().min(1),
  occurred_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const transferSchema = z.object({
  amount: z.number().positive(),
  description: z.string().trim().min(1),
  from_account_id: z.string().min(1),
  to_account_id: z.string().min(1),
  occurred_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addMonthsIso(iso: string, months: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

const TITLE: Record<EntryType, string> = {
  income: t.newTransaction.titleIncome,
  expense: t.newTransaction.titleExpense,
  transfer: t.transfers.titleTransfer,
};

const AMOUNT_LABEL: Record<EntryType, string> = {
  income: t.newTransaction.amountIncome,
  expense: t.newTransaction.amountExpense,
  transfer: t.newTransaction.amountTransfer,
};

export default function NewTransactionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const sessionRoute = useSessionRoute();
  const activeScope = useAuthStore((s) => s.activeScope);
  const contexts = useAuthStore((s) => s.contexts);
  const isConsolidated = activeScope === CONSOLIDATED;
  const params = useLocalSearchParams<{ type?: EntryType }>();
  const initialType: EntryType =
    params.type === 'income' || params.type === 'transfer' ? params.type : 'expense';

  const [type, setType] = useState<EntryType>(initialType);
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [occurredAt, setOccurredAt] = useState(todayIso());
  const [settled, setSettled] = useState(true);
  const [toContextId, setToContextId] = useState(activeScope);
  const [toAccountId, setToAccountId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [notes, setNotes] = useState('');
  const [fixedExpense, setFixedExpense] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [repeatMonths, setRepeatMonths] = useState('2');

  const isTransfer = type === 'transfer';
  const tone = TYPE_TONE[type];

  const accountsQuery = useQuery({
    queryKey: ['accounts', activeScope],
    queryFn: () => accountsApi.listAccounts(activeScope),
    enabled: !isConsolidated && Boolean(activeScope),
  });

  const toAccountsQuery = useQuery({
    queryKey: ['accounts', toContextId],
    queryFn: () => accountsApi.listAccounts(toContextId),
    enabled: !isConsolidated && isTransfer && Boolean(toContextId),
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories', activeScope, type],
    queryFn: () =>
      categoriesApi.listCategories(activeScope, { type: type as 'income' | 'expense' }),
    enabled: !isConsolidated && !isTransfer && Boolean(activeScope),
  });

  const accountOptions = useMemo(
    () => (accountsQuery.data ?? []).map((a) => ({ value: a.id, label: a.name })),
    [accountsQuery.data],
  );
  const accountTypeMap = useMemo(() => {
    const map = new Map<string, AccountType>();
    for (const a of accountsQuery.data ?? []) map.set(a.id, a.type);
    for (const a of toAccountsQuery.data ?? []) map.set(a.id, a.type);
    return map;
  }, [accountsQuery.data, toAccountsQuery.data]);
  const toAccountOptions = useMemo(
    () => (toAccountsQuery.data ?? []).map((a) => ({ value: a.id, label: a.name })),
    [toAccountsQuery.data],
  );
  const contextOptions = useMemo(
    () => contexts.map((c) => ({ value: c.id, label: c.name })),
    [contexts],
  );
  const categoryOptions = useMemo(
    () => [
      { value: '', label: t.newTransaction.categoryNone },
      ...(categoriesQuery.data ?? []).map((c) => ({ value: c.id, label: c.name })),
    ],
    [categoriesQuery.data],
  );

  const sameAccount =
    isTransfer && accountId !== null && accountId === toAccountId && toContextId === activeScope;

  const mutation = useMutation({
    mutationFn: async (variables: { keepOpen: boolean }) => {
      if (isTransfer) {
        await transfersApi.createTransfer(activeScope, {
          from_account_id: accountId!,
          to_account_id: toAccountId!,
          to_context_id: toContextId,
          amount,
          description: description.trim(),
          occurred_at: occurredAt,
        });
        return variables;
      }

      // Despesa fixa (sem fim) ou repetir (com fim calculado) viram uma
      // regra de recorrência — o próprio cadastro já materializa a
      // ocorrência de hoje, não precisa criar o lançamento avulso também.
      if (fixedExpense || repeat) {
        await recurringTransactionsApi.createRecurringTransaction(activeScope, {
          account_id: accountId!,
          category_id: categoryId || null,
          description: description.trim(),
          amount,
          type: type as 'income' | 'expense',
          interval: 'monthly',
          start_date: occurredAt,
          end_date: fixedExpense ? null : addMonthsIso(occurredAt, Number(repeatMonths) || 1),
        });
        return variables;
      }

      await transactionsApi.createTransaction(activeScope, {
        account_id: accountId!,
        category_id: categoryId || null,
        description: description.trim(),
        notes: notes.trim() || null,
        amount,
        type,
        occurred_at: occurredAt,
        settled,
      });
      return variables;
    },
    onSuccess: (variables) => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['accounts'] });
      if (variables.keepOpen) {
        toastSuccess(t.newTransaction.created);
        setAmount(0);
        setDescription('');
        setNotes('');
        setFixedExpense(false);
        setRepeat(false);
        setRepeatMonths('2');
        return;
      }
      router.back();
    },
    onError: (err) => {
      setFormError(
        err instanceof ApiError && err.status === 422
          ? (err.message ?? t.newTransaction.errors.generic)
          : t.newTransaction.errors.generic,
      );
    },
  });

  if (sessionRoute !== '/(tabs)') {
    return <Redirect href={sessionRoute} />;
  }

  function submit(keepOpen: boolean) {
    setFormError(null);

    if (isTransfer) {
      const parsed = transferSchema.safeParse({
        amount,
        description,
        from_account_id: accountId ?? '',
        to_account_id: toAccountId ?? '',
        occurred_at: occurredAt,
      });
      if (!parsed.success || sameAccount) {
        const next: Record<string, string> = {};
        for (const issue of parsed.success ? [] : parsed.error.issues) {
          const key = String(issue.path[0]);
          next[key] =
            key === 'amount'
              ? t.newTransaction.errors.amount
              : key === 'description'
                ? t.newTransaction.errors.description
                : key === 'occurred_at'
                  ? t.newTransaction.errors.date
                  : t.newTransaction.errors.account;
        }
        setErrors(next);
        if (sameAccount) setFormError(t.transfers.sameAccount);
        return;
      }
      setErrors({});
      mutation.mutate({ keepOpen });
      return;
    }

    const parsed = schema.safeParse({
      amount,
      description,
      account_id: accountId ?? '',
      occurred_at: occurredAt,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        next[key] =
          key === 'amount'
            ? t.newTransaction.errors.amount
            : key === 'description'
              ? t.newTransaction.errors.description
              : key === 'account_id'
                ? t.newTransaction.errors.account
                : t.newTransaction.errors.date;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    mutation.mutate({ keepOpen });
  }

  const canSubmit = !mutation.isPending && !(isTransfer && sameAccount);

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          contentContainerClassName="grow"
          keyboardShouldPersistTaps="handled"
        >
          {/* Header — fundo canvas (quase preto no dark), valor em destaque */}
          <View className="gap-4 px-5 pb-6 pt-2">
            <View className="flex-row items-center gap-3">
              <Pressable onPress={() => router.back()} hitSlop={8}>
                <Feather name="arrow-left" size={22} color="#e7efec" />
              </Pressable>
              <Text variant="title">{TITLE[type]}</Text>
            </View>

            {isConsolidated ? null : (
              <AmountHero
                label={AMOUNT_LABEL[type]}
                value={amount}
                onChange={setAmount}
                toneClassName={tone.text}
                toneColor={tone.hex}
                error={errors.amount}
              />
            )}
          </View>

          {isConsolidated ? (
            <View className="items-start gap-3 rounded-t-3xl bg-surface-2 px-5 pb-10 pt-6">
              <Text variant="muted">{t.newTransaction.needContext}</Text>
              <ContextSwitcher />
            </View>
          ) : (
            <View className="grow gap-4 rounded-t-3xl bg-surface-2 px-5 pb-48 pt-6">
              {/* Tipo */}
              <View className="flex-row rounded-xl border border-line bg-surface p-1">
                {(['expense', 'income', 'transfer'] as EntryType[]).map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => {
                      setType(option);
                      setCategoryId(null);
                      setToAccountId(null);
                      setToContextId(activeScope);
                    }}
                    className={cn(
                      'flex-1 items-center rounded-lg py-2',
                      type === option && TYPE_TONE[option].bg,
                    )}
                  >
                    <Text
                      className={cn(
                        'text-sm',
                        type === option
                          ? cn('font-semibold', TYPE_TONE[option].text)
                          : 'text-fg-muted',
                      )}
                    >
                      {option === 'income'
                        ? t.newTransaction.typeIncome
                        : option === 'expense'
                          ? t.newTransaction.typeExpense
                          : t.transfers.create}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {isTransfer ? null : (
                <SwitchField
                  label={type === 'income' ? t.newTransaction.received : t.newTransaction.paid}
                  value={settled}
                  onChange={setSettled}
                  toneColor={tone.hex}
                />
              )}

              <QuickDateField
                value={occurredAt}
                onChange={setOccurredAt}
                toneClassName={tone.solidBg}
              />
              {errors.occurred_at ? <Text variant="error">{errors.occurred_at}</Text> : null}

              <TextField
                label={t.newTransaction.description}
                placeholder={t.newTransaction.descriptionPlaceholder}
                value={description}
                onChangeText={setDescription}
                error={errors.description}
              />

              {isTransfer ? (
                <>
                  <SelectField
                    label={t.transfers.from}
                    placeholder={t.newTransaction.accountPlaceholder}
                    value={accountId}
                    options={accountOptions}
                    onChange={setAccountId}
                    error={errors.account_id}
                    renderIcon={(opt) => {
                      const accType = accountTypeMap.get(opt.value);
                      return accType ? <AccountIcon type={accType} size="sm" /> : null;
                    }}
                  />
                  <SelectField
                    label={t.transfers.toContext}
                    placeholder={t.common.select}
                    value={toContextId}
                    options={contextOptions}
                    onChange={(v) => {
                      setToContextId(v);
                      setToAccountId(null);
                    }}
                  />
                  <SelectField
                    label={t.transfers.to}
                    placeholder={t.newTransaction.accountPlaceholder}
                    value={toAccountId}
                    options={toAccountOptions}
                    onChange={setToAccountId}
                    renderIcon={(opt) => {
                      const accType = accountTypeMap.get(opt.value);
                      return accType ? <AccountIcon type={accType} size="sm" /> : null;
                    }}
                  />
                  {sameAccount ? <Text variant="error">{t.transfers.sameAccount}</Text> : null}
                </>
              ) : (
                <>
                  <SelectField
                    label={t.newTransaction.category}
                    placeholder={t.newTransaction.categoryPlaceholder}
                    value={categoryId ?? ''}
                    options={categoryOptions}
                    onChange={(v) => setCategoryId(v || null)}
                    searchable
                    renderIcon={(opt) => (
                      <CategoryIcon categoryId={opt.value || null} name={opt.label} size="sm" />
                    )}
                  />
                  <SelectField
                    label={t.newTransaction.account}
                    placeholder={t.newTransaction.accountPlaceholder}
                    value={accountId}
                    options={accountOptions}
                    onChange={setAccountId}
                    error={errors.account_id}
                    renderIcon={(opt) => {
                      const accType = accountTypeMap.get(opt.value);
                      return accType ? <AccountIcon type={accType} size="sm" /> : null;
                    }}
                  />
                </>
              )}

              {isTransfer ? null : (
                <>
                  <Pressable
                    onPress={() => {
                      setShowMoreDetails((v) => !v);
                      // Os campos novos (despesa fixa/repetir/observação) só
                      // entram no layout depois deste render — sem o atraso,
                      // `scrollToEnd` mede o scroll ANTES deles existirem e
                      // não desce o suficiente, deixando Observação atrás do
                      // botão flutuante de salvar.
                      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 80);
                    }}
                    className="items-center py-1"
                  >
                    <Text
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: tone.hex }}
                    >
                      {showMoreDetails
                        ? t.newTransaction.lessDetails
                        : t.newTransaction.moreDetails}
                    </Text>
                  </Pressable>

                  {showMoreDetails ? (
                    <View className="gap-4">
                      <SwitchField
                        label={
                          type === 'income'
                            ? t.newTransaction.fixedIncome
                            : t.newTransaction.fixedExpense
                        }
                        value={fixedExpense}
                        onChange={(v) => {
                          setFixedExpense(v);
                          if (v) setRepeat(false);
                        }}
                        toneColor={tone.hex}
                      />
                      <SwitchField
                        label={t.newTransaction.repeat}
                        value={repeat}
                        onChange={(v) => {
                          setRepeat(v);
                          if (v) setFixedExpense(false);
                        }}
                        toneColor={tone.hex}
                      />
                      {repeat ? (
                        <TextField
                          label={t.newTransaction.repeatMonths}
                          value={repeatMonths}
                          onChangeText={(v) => setRepeatMonths(v.replace(/\D/g, ''))}
                          keyboardType="number-pad"
                        />
                      ) : null}
                      <TextField
                        label={t.newTransaction.notes}
                        placeholder={t.newTransaction.notesPlaceholder}
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                      />
                    </View>
                  ) : null}
                </>
              )}

              {formError ? <Text variant="error">{formError}</Text> : null}
            </View>
          )}
        </ScrollView>

        {isConsolidated ? null : (
          <View
            className="absolute left-0 right-0 items-center"
            style={{ bottom: 20 + insets.bottom }}
            pointerEvents="box-none"
          >
            {isTransfer ? null : (
              <Pressable
                onPress={() => submit(true)}
                disabled={!canSubmit}
                hitSlop={8}
                className="mb-3 items-center"
              >
                <Text
                  className="text-sm font-semibold uppercase tracking-wide"
                  style={{ color: tone.hex, opacity: canSubmit ? 1 : 0.5 }}
                >
                  {t.newTransaction.saveAndContinue}
                </Text>
              </Pressable>
            )}
            <Pressable
              accessibilityLabel={t.newTransaction.submit}
              onPress={() => submit(false)}
              disabled={!canSubmit}
              className={cn(
                'size-16 items-center justify-center rounded-full shadow-lg',
                !canSubmit && 'opacity-50',
              )}
              style={{ backgroundColor: tone.hex, elevation: 8 }}
            >
              {mutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Feather name="check" size={28} color="#fff" />
              )}
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
