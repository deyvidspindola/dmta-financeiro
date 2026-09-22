import { useMemo, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountsApi, categoriesApi, transactionsApi } from '@/api';
import type { RecurrenceEditScope } from '@/api/transactions';
import { ApiError } from '@/api/http';
import { Badge, Button, ConfirmSheet, MoneyValue, SelectField, Sheet, Text } from '@/components/ui';
import { RecurrenceScopeSheet } from '@/components/transactions/RecurrenceScopeSheet';
import { t } from '@/i18n';
import { formatDateShort } from '@/lib/dates';
import { transactionDirection } from '@/lib/transactionDisplay';
import { useAuthStore } from '@/store/authStore';
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

/** Detalhe de um lançamento — abre em sheet a partir da lista. */
export function TransactionDetailSheet({
  entry,
  contextId,
  accountName,
  categoryName,
  onClose,
}: Props) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const contexts = useAuthStore((s) => s.contexts);

  const [mode, setMode] = useState<'detail' | 'move'>('detail');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [scopePrompt, setScopePrompt] = useState(false);
  const [targetContextId, setTargetContextId] = useState<string | null>(null);
  const [targetAccountId, setTargetAccountId] = useState<string | null>(null);
  const [targetCategoryId, setTargetCategoryId] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);

  // Fechar (ou terminar uma ação) volta pro estado inicial — a sheet nunca
  // troca de lançamento com ela já aberta, só abre (null → entry) e fecha
  // (entry → null), então resetar aqui cobre o próximo open também.
  const reset = () => {
    setMode('detail');
    setConfirmDelete(false);
    setScopePrompt(false);
    setTargetContextId(null);
    setTargetAccountId(null);
    setTargetCategoryId(null);
    setMoveError(null);
  };
  const handleClose = () => {
    reset();
    onClose();
  };

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['transactions'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    void queryClient.invalidateQueries({ queryKey: ['accounts'] });
  };

  const settle = useMutation({
    mutationFn: () => transactionsApi.settleTransaction(contextId!, entry!.id),
    onSuccess: () => {
      invalidate();
      handleClose();
    },
  });

  const remove = useMutation({
    mutationFn: (scope: RecurrenceEditScope) =>
      transactionsApi.deleteTransaction(contextId!, entry!.id, scope),
    onSuccess: () => {
      invalidate();
      handleClose();
    },
    onError: () => {
      setConfirmDelete(false);
      setScopePrompt(false);
    },
  });

  function startDelete() {
    if (entry?.recurring_transaction_id) {
      setScopePrompt(true);
      return;
    }
    setConfirmDelete(true);
  }

  const targetAccountsQuery = useQuery({
    queryKey: ['accounts', targetContextId],
    queryFn: () => accountsApi.listAccounts(targetContextId!),
    enabled: mode === 'move' && Boolean(targetContextId),
  });

  const targetCategoriesQuery = useQuery({
    queryKey: ['categories', targetContextId, entry?.type],
    queryFn: () =>
      categoriesApi.listCategories(targetContextId!, {
        type: entry!.type === 'income' ? 'income' : 'expense',
      }),
    enabled: mode === 'move' && Boolean(targetContextId) && entry?.type !== 'transfer',
  });

  const move = useMutation({
    mutationFn: () =>
      transactionsApi.moveTransaction(contextId!, entry!.id, {
        target_context_id: targetContextId!,
        target_account_id: targetAccountId!,
        target_category_id: targetCategoryId,
      }),
    onSuccess: () => {
      invalidate();
      handleClose();
    },
    onError: (err) =>
      setMoveError(err instanceof ApiError && err.message ? err.message : t.common.error),
  });

  const contextOptions = useMemo(
    () => contexts.filter((c) => c.id !== contextId).map((c) => ({ value: c.id, label: c.name })),
    [contexts, contextId],
  );
  const targetAccountOptions = useMemo(
    () => (targetAccountsQuery.data ?? []).map((a) => ({ value: a.id, label: a.name })),
    [targetAccountsQuery.data],
  );
  const targetCategoryOptions = useMemo(
    () => (targetCategoriesQuery.data ?? []).map((c) => ({ value: c.id, label: c.name })),
    [targetCategoriesQuery.data],
  );

  const tags: string[] = [];
  if (entry?.bill_id) tags.push(t.transactions.detail.fromBill);
  if (entry?.card_invoice_id) tags.push(t.transactions.detail.fromCard);
  if (entry?.recurring_transaction_id) tags.push(t.transactions.detail.fromRecurring);
  if (entry?.goal_id) tags.push(t.transactions.detail.toGoal);
  if (entry?.transfer_pair_id) tags.push(t.transactions.detail.transfer);

  const isPending = entry?.status === 'pending';
  // Perna de transferência, vinculado a boleto/meta/fatura — o outro lado
  // teria que mudar de contexto junto, o que essa ação simples não faz
  // (mesma regra de MoveTransactionToContext no backend).
  const canMove =
    Boolean(contextId) &&
    !entry?.transfer_pair_id &&
    !entry?.bill_id &&
    !entry?.goal_id &&
    !entry?.card_invoice_id;

  return (
    <Sheet
      open={entry !== null}
      onClose={handleClose}
      title={mode === 'move' ? t.transactions.moveTitle : t.transactions.detail.title}
    >
      {entry && mode === 'detail' ? (
        <View>
          <View className="mb-2 gap-1">
            <View className="flex-row items-center gap-2">
              <Text variant="title" className="text-lg" numberOfLines={2}>
                {entry.description}
              </Text>
              {isPending ? <Badge tone="warning">{t.transactions.pendingBadge}</Badge> : null}
            </View>
            <MoneyValue amount={entry.amount} direction={transactionDirection(entry)} size="xl" />
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

          {contextId ? (
            <View className="mt-4 gap-2">
              <Button
                label={t.transactions.detail.edit}
                variant="secondary"
                onPress={() => {
                  handleClose();
                  router.push({
                    pathname: '/edit-transaction',
                    params: { contextId, transactionId: entry.id },
                  });
                }}
              />
              {isPending ? (
                <>
                  {settle.isError ? (
                    <Text variant="error">{t.transactions.detail.settleError}</Text>
                  ) : null}
                  <Button
                    label={t.transactions.detail.markSettled}
                    loading={settle.isPending}
                    onPress={() => settle.mutate()}
                  />
                </>
              ) : null}
            </View>
          ) : null}

          {entry.settled_at ? (
            <Text variant="muted" className="mt-4 text-xs text-fg-subtle">
              {t.transactions.detail.settledOn(formatDateShort(entry.settled_at.slice(0, 10)))}
            </Text>
          ) : null}

          {canMove || contextId ? (
            <View className="mt-4 flex-row justify-between gap-2">
              {canMove ? (
                <Button
                  label={t.transactions.move}
                  variant="ghost"
                  onPress={() => setMode('move')}
                />
              ) : (
                <View />
              )}
              {contextId ? (
                <Button label={t.common.delete} variant="ghost" onPress={startDelete} />
              ) : null}
            </View>
          ) : null}
        </View>
      ) : entry && mode === 'move' ? (
        <View className="gap-4">
          <Text variant="muted" numberOfLines={1}>
            {entry.description} · {formatDateShort(entry.date)}
          </Text>

          <SelectField
            label={t.transactions.targetContext}
            placeholder={t.common.select}
            value={targetContextId}
            options={contextOptions}
            onChange={(v) => {
              setTargetContextId(v);
              setTargetAccountId(null);
              setTargetCategoryId(null);
            }}
          />
          <SelectField
            label={t.transactions.targetAccount}
            placeholder={t.newTransaction.accountPlaceholder}
            value={targetAccountId}
            options={targetAccountOptions}
            onChange={setTargetAccountId}
          />
          {entry.type !== 'transfer' ? (
            <SelectField
              label={t.transactions.category}
              placeholder={t.bills.category}
              value={targetCategoryId ?? ''}
              options={targetCategoryOptions}
              onChange={(v) => setTargetCategoryId(v || null)}
            />
          ) : null}

          {moveError ? <Text variant="error">{moveError}</Text> : null}

          <View className="flex-row justify-between gap-2">
            <Button label={t.common.cancel} variant="ghost" onPress={() => setMode('detail')} />
            <Button
              label={t.transactions.move}
              loading={move.isPending}
              disabled={!targetContextId || !targetAccountId}
              onPress={() => {
                setMoveError(null);
                move.mutate();
              }}
            />
          </View>
        </View>
      ) : null}

      <ConfirmSheet
        open={confirmDelete}
        title={t.transactions.detail.title}
        message={t.transactions.confirmDelete}
        confirmLabel={t.common.delete}
        tone="danger"
        loading={remove.isPending}
        onConfirm={() => remove.mutate('this')}
        onClose={() => setConfirmDelete(false)}
      />

      <RecurrenceScopeSheet
        open={scopePrompt}
        action="delete"
        onChoose={(scope) => remove.mutate(scope)}
        onClose={() => setScopePrompt(false)}
      />
    </Sheet>
  );
}
