import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { accountsApi, creditCardsApi } from '@/api';
import { ApiError } from '@/api/http';
import { toastError, toastSuccess } from '@/store/toastStore';
import { Badge, Button, ConfirmSheet, Money, MoneyValue, SelectField, Sheet, Skeleton, Text } from '@/components/ui';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { formatDateShort, formatMonthLabel } from '@/lib/dates';
import type { CardPurchase, CreditCard, InvoiceStatus } from '@/types/models';

const INVOICE_TONE: Record<InvoiceStatus, 'neutral' | 'accent' | 'brand'> = {
  open: 'brand',
  closed: 'accent',
  paid: 'neutral',
};

/** Mesma regra do `apps/web`: o backend recusa editar parcela ou compra em fatura paga. */
function isPurchaseEditable(purchase: CardPurchase, invoiceStatus: InvoiceStatus): boolean {
  return purchase.installment_number == null && invoiceStatus !== 'paid';
}

export function CardDetailSheet({ card, onClose }: { card: CreditCard | null; onClose: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payAccountId, setPayAccountId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<'none' | 'first' | 'paid'>('none');
  const [toDeletePurchase, setToDeletePurchase] = useState<CardPurchase | null>(null);
  const [openInvoiceId, setOpenInvoiceId] = useState<string | null>(null);

  const invoicesQuery = useQuery({
    queryKey: ['card-invoices', card?.context_id, card?.id],
    queryFn: () => creditCardsApi.listCardInvoices(card!.context_id, card!.id),
    enabled: card !== null && Boolean(card?.context_id),
  });

  const accountsQuery = useQuery({
    queryKey: ['accounts', card?.context_id],
    queryFn: () => accountsApi.listAccounts(card!.context_id),
    enabled: payingId !== null && Boolean(card?.context_id),
  });

  const purchasesQuery = useQuery({
    queryKey: ['card-purchases', card?.context_id, card?.id, openInvoiceId],
    queryFn: () => creditCardsApi.listCardPurchases(card!.context_id, card!.id, openInvoiceId!),
    enabled: openInvoiceId !== null && Boolean(card?.context_id),
  });

  const accountOptions = useMemo(
    () => (accountsQuery.data ?? []).map((a) => ({ value: a.id, label: a.name })),
    [accountsQuery.data],
  );

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['credit-cards'] });
    void queryClient.invalidateQueries({ queryKey: ['card-invoices'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    void queryClient.invalidateQueries({ queryKey: ['accounts'] });
  };

  const pay = useMutation({
    mutationFn: (invoiceId: string) =>
      creditCardsApi.payCardInvoice(card!.context_id, card!.id, invoiceId, payAccountId!),
    onSuccess: () => {
      invalidate();
      setPayingId(null);
      setPayAccountId(null);
    },
  });

  const remove = useMutation({
    mutationFn: (force: boolean) =>
      creditCardsApi.deleteCreditCard(card!.context_id, card!.id, force),
    onSuccess: () => {
      invalidate();
      setConfirmDelete('none');
      toastSuccess(t.creditCards.deleted);
      onClose();
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 422) {
        setConfirmDelete('paid');
        return;
      }
      setConfirmDelete('none');
      toastError(t.common.error);
    },
  });

  const removePurchase = useMutation({
    mutationFn: (purchase: CardPurchase) =>
      creditCardsApi.deleteCardPurchase(
        card!.context_id,
        card!.id,
        purchase.id,
        (purchase.installment_total ?? 0) > 1 ? 'group' : undefined,
      ),
    onSuccess: () => {
      invalidate();
      setToDeletePurchase(null);
      toastSuccess(t.creditCards.purchaseDeleted);
    },
    onError: (err) => {
      setToDeletePurchase(null);
      toastError(err instanceof ApiError && err.message ? err.message : t.common.error);
    },
  });

  function openPurchaseForm(purchase?: CardPurchase) {
    if (!card) return;
    router.push({
      pathname: '/card-purchase',
      params: {
        cardId: card.id,
        contextId: card.context_id,
        ...(purchase
          ? {
              purchaseId: purchase.id,
              description: purchase.description,
              amount: String(purchase.amount),
              categoryId: purchase.category_id ?? '',
              occurredAt: purchase.occurred_at,
            }
          : {}),
      },
    });
    onClose();
  }

  return (
    <>
    <Sheet open={card !== null} onClose={onClose} title={card?.name}>
      <View className="mb-3 flex-row items-center justify-between">
        <Text variant="muted" className="text-xs">
          {card ? t.creditCards.cycle(card.closing_day, card.due_day) : ''}
        </Text>
        <Button label={t.creditCards.newPurchase} variant="secondary" onPress={() => openPurchaseForm()} className="h-9 px-3" />
      </View>

      <Text variant="label" className="mb-1">
        {t.creditCards.invoices}
      </Text>

      {invoicesQuery.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : (invoicesQuery.data ?? []).length === 0 ? (
        <Text variant="muted">{t.creditCards.noInvoices}</Text>
      ) : (
        <View>
          {(invoicesQuery.data ?? []).map((invoice) => {
            const expanded = openInvoiceId === invoice.id;
            return (
              <View key={invoice.id}>
                <Pressable
                  onPress={() => setOpenInvoiceId(expanded ? null : invoice.id)}
                  className="flex-row items-center justify-between gap-3 border-b border-line py-3 active:bg-surface-2"
                >
                  <View className="gap-0.5">
                    <Text className="font-medium">
                      {formatMonthLabel(invoice.reference_month.slice(0, 7))}
                    </Text>
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
                </Pressable>

                {expanded ? (
                  <View className="gap-2 border-b border-line py-2 pl-2">
                    {purchasesQuery.isLoading ? (
                      <Skeleton className="h-12 w-full" />
                    ) : (purchasesQuery.data ?? []).length === 0 ? (
                      <Text variant="muted" className="text-xs">
                        {t.creditCards.noPurchases}
                      </Text>
                    ) : (
                      (purchasesQuery.data ?? []).map((p) => (
                        <View
                          key={p.id}
                          className="flex-row items-center gap-2 border-b border-line py-2.5"
                        >
                          <Pressable
                            onPress={() =>
                              isPurchaseEditable(p, invoice.status)
                                ? openPurchaseForm(p)
                                : toastError(t.creditCards.editPurchaseBlocked)
                            }
                            className={cn(
                              'min-w-0 flex-1 flex-row items-center justify-between gap-3',
                              isPurchaseEditable(p, invoice.status) && 'active:opacity-60',
                            )}
                          >
                            <Text numberOfLines={1} className="flex-1">
                              {p.description}
                              {(p.installment_total ?? 0) > 1
                                ? ` (${p.installment_number}/${p.installment_total})`
                                : ''}
                            </Text>
                            <MoneyValue amount={p.amount} direction="debit" size="sm" />
                          </Pressable>
                          {invoice.status !== 'paid' ? (
                            <Pressable
                              onPress={() => setToDeletePurchase(p)}
                              hitSlop={8}
                              className="p-1 active:opacity-60"
                            >
                              <Feather name="trash-2" size={16} color="#ef4444" />
                            </Pressable>
                          ) : null}
                        </View>
                      ))
                    )}

                    {invoice.status !== 'paid' ? (
                      payingId === invoice.id ? (
                        <View className="gap-2 pt-1">
                          <SelectField
                            label={t.creditCards.payFrom}
                            placeholder={t.newTransaction.accountPlaceholder}
                            value={payAccountId}
                            options={accountOptions}
                            onChange={setPayAccountId}
                          />
                          {pay.isError ? (
                            <Text variant="error">{t.creditCards.payError}</Text>
                          ) : null}
                          <Button
                            label={t.creditCards.payInvoiceAction}
                            loading={pay.isPending}
                            disabled={!payAccountId}
                            onPress={() => pay.mutate(invoice.id)}
                          />
                        </View>
                      ) : (
                        <Pressable
                          onPress={() => {
                            setPayingId(invoice.id);
                            setPayAccountId(null);
                          }}
                          className={cn(
                            'mt-1 self-start rounded-lg bg-brand-500/15 px-3 py-1.5 active:bg-brand-500/25',
                          )}
                        >
                          <Text className="text-xs font-medium text-brand-700 dark:text-brand-300">
                            {t.creditCards.payInvoiceAction}
                          </Text>
                        </Pressable>
                      )
                    ) : null}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}

      {card ? (
        <Button
          label={t.creditCards.delete}
          variant="ghost"
          onPress={() => setConfirmDelete('first')}
          className="mt-4"
        />
      ) : null}
    </Sheet>

      <ConfirmSheet
        open={confirmDelete === 'first'}
        title={t.creditCards.delete}
        message={t.creditCards.confirmDelete}
        confirmLabel={t.common.delete}
        tone="danger"
        loading={remove.isPending}
        onConfirm={() => remove.mutate(false)}
        onClose={() => setConfirmDelete('none')}
      />

      <ConfirmSheet
        open={confirmDelete === 'paid'}
        title={t.creditCards.delete}
        message={t.creditCards.confirmDeletePaid}
        confirmLabel={t.common.delete}
        tone="danger"
        loading={remove.isPending}
        onConfirm={() => remove.mutate(true)}
        onClose={() => setConfirmDelete('none')}
      />

      <ConfirmSheet
        open={toDeletePurchase !== null}
        title={t.common.delete}
        message={
          (toDeletePurchase?.installment_total ?? 0) > 1
            ? t.creditCards.confirmDeletePurchaseGroup(toDeletePurchase?.installment_total ?? 0)
            : t.creditCards.confirmDeletePurchase
        }
        confirmLabel={t.common.delete}
        tone="danger"
        loading={removePurchase.isPending}
        onConfirm={() => toDeletePurchase && removePurchase.mutate(toDeletePurchase)}
        onClose={() => setToDeletePurchase(null)}
      />
    </>
  );
}
