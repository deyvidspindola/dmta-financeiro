<?php

declare(strict_types=1);

namespace App\UseCases\Transaction;

use App\Enums\BillStatus;
use App\Enums\StatementEntryType;
use App\Models\Account;
use App\Models\Bill;
use App\Models\StatementEntry;
use Illuminate\Support\Facades\DB;

/**
 * Apaga um lançamento e desfaz o efeito dele: reverte o saldo da conta
 * (sinal contrário ao de {@see RegisterTransaction}) e, se o lançamento
 * tinha um boleto vinculado, devolve o boleto pra `pending` — apagar o
 * pagamento é "desfazer que foi pago", não deixar o boleto órfão como
 * pago sem lançamento nenhum.
 *
 * Se o lançamento for uma perna de transferência ({@see TransferBetweenAccounts}),
 * apaga as duas pernas junto e reverte o saldo das duas contas — nunca
 * deixa uma transferência pela metade.
 *
 * @package App\UseCases\Transaction
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final class DeleteTransaction
{
    public function execute(StatementEntry $entry): void
    {
        DB::transaction(function () use ($entry): void {
            if ($entry->transfer_pair_id !== null) {
                $this->deleteTransferPair($entry);

                return;
            }

            $this->revertBalance($entry);

            if ($entry->bill_id !== null) {
                Bill::query()->whereKey($entry->bill_id)->update([
                    'status' => BillStatus::Pending->value,
                    'paid_at' => null,
                ]);
            }

            $entry->delete();
        });
    }

    /**
     * Reverte o saldo das duas contas e apaga as duas pernas.
     *
     * As duas pernas têm `type = transfer` — não dá pra saber por `type`
     * qual delas foi o débito e qual foi o crédito. {@see TransferBetweenAccounts}
     * sempre cria a perna de origem (débito) primeiro, então ela sempre
     * tem o `id` menor; é assim que distinguimos aqui pra reverter cada
     * lado com o sinal certo.
     */
    private function deleteTransferPair(StatementEntry $entry): void
    {
        /** @var StatementEntry $pair */
        $pair = StatementEntry::query()->whereKey($entry->transfer_pair_id)->firstOrFail();

        [$debitLeg, $creditLeg] = $entry->id < $pair->id ? [$entry, $pair] : [$pair, $entry];

        Account::query()->whereKey($debitLeg->account_id)->lockForUpdate()->increment('balance', $debitLeg->amount);
        Account::query()->whereKey($creditLeg->account_id)->lockForUpdate()->decrement('balance', $creditLeg->amount);

        $entry->update(['transfer_pair_id' => null]);
        $pair->update(['transfer_pair_id' => null]);
        $pair->delete();
        $entry->delete();
    }

    /** Devolve à conta o valor que este lançamento havia movido. */
    private function revertBalance(StatementEntry $entry): void
    {
        // $entry->type já vem como enum (cast no model, confirmado em
        // runtime) — comparar contra o case, não contra ->value, ou a
        // comparação estrita nunca bate e o sinal sai sempre errado.
        // @phpstan-ignore-next-line identical.alwaysFalse (larastan erra os dois lados dessa inferência — ver Models/StatementEntry.php)
        $sign = $entry->type === StatementEntryType::Expense ? 1 : -1;

        Account::query()->whereKey($entry->account_id)->lockForUpdate()->increment('balance', $sign * $entry->amount);
    }
}
