<?php

declare(strict_types=1);

namespace App\UseCases\Transaction;

use App\DTOs\MoveTransactionToContextData;
use App\Enums\StatementEntryType;
use App\Exceptions\Domain\AccountContextMismatchException;
use App\Exceptions\Domain\CategoryContextMismatchException;
use App\Exceptions\Domain\TransactionNotMovableException;
use App\Models\Account;
use App\Models\Category;
use App\Models\StatementEntry;
use Illuminate\Support\Facades\DB;

/**
 * Move um lançamento cadastrado no contexto errado (ex.: despesa da
 * empresa lançada sem querer no PF) pro contexto certo — reverte o saldo
 * na conta de origem e aplica na conta de destino informada (tem que
 * pertencer ao contexto de destino; contas não atravessam contexto
 * sozinhas). O tipo do lançamento (receita/despesa) não muda, só quem é
 * dono dele.
 *
 * Bloqueado pra perna de transferência, lançamento vinculado a boleto ou
 * aporte de meta — nos três casos, mover o lançamento sozinho deixaria o
 * outro lado (perna par, boleto, ou meta) apontando pra outro contexto.
 * Ver {@see TransactionNotMovableException}.
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
final class MoveTransactionToContext
{
    /**
     * @throws TransactionNotMovableException
     * @throws AccountContextMismatchException Se a conta de destino não for do contexto de destino.
     * @throws CategoryContextMismatchException Se a categoria de destino não for do contexto de destino.
     */
    public function execute(StatementEntry $entry, MoveTransactionToContextData $data): StatementEntry
    {
        if ($entry->transfer_pair_id !== null || $entry->bill_id !== null
            || $entry->goal_id !== null || $entry->card_invoice_id !== null) {
            throw new TransactionNotMovableException;
        }

        return DB::transaction(function () use ($entry, $data): StatementEntry {
            /** @var Account $targetAccount */
            $targetAccount = Account::query()->whereKey($data->targetAccountId)->lockForUpdate()->firstOrFail();

            if ($targetAccount->context_id !== $data->targetContextId) {
                throw new AccountContextMismatchException;
            }

            if ($data->targetCategoryId !== null) {
                $category = Category::query()
                    ->whereKey($data->targetCategoryId)
                    ->where('context_id', $data->targetContextId)
                    ->exists();

                if (! $category) {
                    throw new CategoryContextMismatchException;
                }
            }

            // $entry->type já vem como enum (cast no model) — comparar
            // contra o case, nunca contra ->value (ver DeleteTransaction).
            // @phpstan-ignore-next-line identical.alwaysFalse (larastan erra os dois lados dessa inferência)
            $sign = $entry->type === StatementEntryType::Expense ? -1 : 1;

            Account::query()->whereKey($entry->account_id)->lockForUpdate()
                ->increment('balance', -1 * $sign * (float) $entry->amount);
            $targetAccount->increment('balance', $sign * (float) $entry->amount);

            $entry->update([
                'context_id' => $data->targetContextId,
                'account_id' => $data->targetAccountId,
                'category_id' => $data->targetCategoryId,
            ]);

            return $entry->fresh();
        });
    }
}
