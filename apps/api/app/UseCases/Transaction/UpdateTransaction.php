<?php

declare(strict_types=1);

namespace App\UseCases\Transaction;

use App\DTOs\UpdateTransactionData;
use App\Enums\StatementEntryType;
use App\Exceptions\Domain\TransactionNotEditableException;
use App\Models\Account;
use App\Models\StatementEntry;
use Illuminate\Support\Facades\DB;

/**
 * Edita um lançamento manual já existente: reverte o efeito antigo no
 * saldo (mesma conta ou não) e aplica o efeito novo — nunca faz diff, pra
 * não arriscar arredondamento acumulado; sempre desfaz tudo e refaz tudo
 * na mesma transação de banco.
 *
 * Bloqueado pra perna de transferência ou lançamento vinculado a boleto —
 * ver {@see TransactionNotEditableException}.
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
final class UpdateTransaction
{
    /** @throws TransactionNotEditableException */
    public function execute(StatementEntry $entry, UpdateTransactionData $data): StatementEntry
    {
        if ($entry->transfer_pair_id !== null || $entry->bill_id !== null) {
            throw new TransactionNotEditableException;
        }

        return DB::transaction(function () use ($entry, $data): StatementEntry {
            // $entry->type já vem como enum (cast no model) — comparar
            // contra o case, nunca contra ->value (ver DeleteTransaction).
            // @phpstan-ignore-next-line identical.alwaysFalse (larastan erra os dois lados dessa inferência)
            $oldSign = $entry->type === StatementEntryType::Expense ? -1 : 1;
            Account::query()->whereKey($entry->account_id)->lockForUpdate()
                ->increment('balance', -1 * $oldSign * (float) $entry->amount);

            $newSign = $data->type === StatementEntryType::Expense ? -1 : 1;
            Account::query()->whereKey($data->accountId)->lockForUpdate()
                ->increment('balance', $newSign * $data->amount);

            $entry->update([
                'account_id' => $data->accountId,
                'category_id' => $data->categoryId,
                'description' => $data->description,
                'amount' => $data->amount,
                'type' => $data->type->value,
                'occurred_at' => $data->occurredAt,
            ]);

            return $entry->fresh();
        });
    }
}
