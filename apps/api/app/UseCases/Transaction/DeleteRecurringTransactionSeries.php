<?php

declare(strict_types=1);

namespace App\UseCases\Transaction;

use App\Enums\RecurrenceEditScope;
use App\Models\RecurringTransaction;
use App\Models\StatementEntry;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Apaga todas as ocorrências futuras (ou a série inteira) de um
 * lançamento recorrente de uma vez — pedido do dono (22/09/2026).
 * Reaproveita {@see DeleteTransaction} pra cada ocorrência dentro do
 * alcance (mesma reversão de saldo/meta que uma exclusão avulsa já faz).
 *
 * `Future`: apaga as ocorrências a partir da referência (inclusive) e
 * desativa a regra — nada mais nasce depois daqui; ocorrências
 * anteriores à referência não são tocadas. `All`: apaga a série inteira,
 * passado incluído, e a própria regra. `This` não é tratado aqui — o
 * controller resolve pra {@see DeleteTransaction} direto nesse caso.
 *
 * @package App\UseCases\Transaction
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   22/09/2026
 */
final class DeleteRecurringTransactionSeries
{
    public function __construct(private readonly DeleteTransaction $deleteTransaction) {}

    public function execute(StatementEntry $reference, RecurrenceEditScope $scope): void
    {
        DB::transaction(function () use ($reference, $scope): void {
            /** @var RecurringTransaction $rule */
            $rule = RecurringTransaction::query()
                ->whereKey($reference->recurring_transaction_id)
                ->lockForUpdate()
                ->firstOrFail();

            $entries = StatementEntry::query()
                ->where('recurring_transaction_id', $rule->id)
                ->when(
                    $scope === RecurrenceEditScope::Future,
                    // @phpstan-ignore-next-line method.nonObject (cast 'date' da migration)
                    fn (Builder $q) => $q->where('occurred_at', '>=', $reference->occurred_at->toDateString()),
                )
                ->get();

            foreach ($entries as $entry) {
                $this->deleteTransaction->execute($entry);
            }

            if ($scope === RecurrenceEditScope::All) {
                $rule->delete();
            } else {
                $rule->update(['active' => false]);
            }
        });
    }
}
