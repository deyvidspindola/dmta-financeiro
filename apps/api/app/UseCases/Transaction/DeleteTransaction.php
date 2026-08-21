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
            // $entry->type já vem como enum (cast no model, confirmado em
            // runtime) — comparar contra o case, não contra ->value, ou a
            // comparação estrita nunca bate e o sinal sai sempre errado.
            // @phpstan-ignore-next-line identical.alwaysFalse (larastan erra os dois lados dessa inferência — ver Models/StatementEntry.php)
            $sign = $entry->type === StatementEntryType::Expense ? 1 : -1;

            Account::query()->whereKey($entry->account_id)->lockForUpdate()->increment('balance', $sign * $entry->amount);

            if ($entry->bill_id !== null) {
                Bill::query()->whereKey($entry->bill_id)->update([
                    'status' => BillStatus::Pending->value,
                    'paid_at' => null,
                ]);
            }

            $entry->delete();
        });
    }
}
