<?php

declare(strict_types=1);

namespace App\UseCases\Transaction;

use App\DTOs\UpdateRecurringTransactionSeriesData;
use App\DTOs\UpdateTransactionData;
use App\Enums\RecurrenceEditScope;
use App\Models\RecurringTransaction;
use App\Models\StatementEntry;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Edita todas as ocorrências futuras (ou a série inteira) de um
 * lançamento recorrente de uma vez — pedido do dono (22/09/2026):
 * "alterar apenas o atual, todas as recorrências, ou só as futuras".
 *
 * Atualiza a regra ({@see RecurringTransaction}) — o que a regra ainda
 * vai gerar já nasce com os dados novos — e reaproveita
 * {@see UpdateTransaction} pra cada ocorrência já materializada dentro
 * do alcance (mesma reversão/reaplicação de saldo e reconciliação de
 * meta que uma edição avulsa já faz, sem duplicar essa lógica aqui).
 * `RecurrenceEditScope::This` não é tratado por este caso de uso — o
 * controller resolve pra {@see UpdateTransaction} direto nesse caso.
 *
 * @package App\UseCases\Transaction
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   22/09/2026
 */
final class UpdateRecurringTransactionSeries
{
    public function __construct(private readonly UpdateTransaction $updateTransaction) {}

    /** @param  StatementEntry  $reference  A ocorrência a partir da qual "futuras" é calculado. */
    public function execute(
        StatementEntry $reference,
        UpdateRecurringTransactionSeriesData $data,
        RecurrenceEditScope $scope,
    ): void {
        DB::transaction(function () use ($reference, $data, $scope): void {
            /** @var RecurringTransaction $rule */
            $rule = RecurringTransaction::query()
                ->whereKey($reference->recurring_transaction_id)
                ->lockForUpdate()
                ->firstOrFail();

            $rule->update([
                'account_id' => $data->accountId,
                'category_id' => $data->categoryId,
                'description' => $data->description,
                'amount' => $data->amount,
                'type' => $data->type->value,
            ]);

            $entries = StatementEntry::query()
                ->where('recurring_transaction_id', $rule->id)
                ->when(
                    $scope === RecurrenceEditScope::Future,
                    // @phpstan-ignore-next-line method.nonObject (cast 'date' da migration)
                    fn (Builder $q) => $q->where('occurred_at', '>=', $reference->occurred_at->toDateString()),
                )
                ->get();

            foreach ($entries as $entry) {
                $this->updateTransaction->execute($entry, new UpdateTransactionData(
                    accountId: $data->accountId,
                    description: $data->description,
                    amount: $data->amount,
                    type: $data->type,
                    // @phpstan-ignore-next-line method.nonObject (cast 'date' da migration)
                    occurredAt: $entry->occurred_at->toDateString(),
                    categoryId: $data->categoryId,
                    goalId: $data->goalId,
                    notes: $data->notes,
                ));
            }
        });
    }
}
