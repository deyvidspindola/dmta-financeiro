<?php

declare(strict_types=1);

namespace App\UseCases\Transaction;

use App\DTOs\UpdateTransactionData;
use App\Enums\StatementEntryType;
use App\Exceptions\Domain\TransactionNotEditableException;
use App\Models\Account;
use App\Models\Goal;
use App\Models\StatementEntry;
use App\UseCases\Goal\UpdateGoalProgress;
use Illuminate\Support\Facades\DB;

/**
 * Edita um lançamento manual já existente: reverte o efeito antigo no
 * saldo (mesma conta ou não) e aplica o efeito novo — nunca faz diff, pra
 * não arriscar arredondamento acumulado; sempre desfaz tudo e refaz tudo
 * na mesma transação de banco. Se o lançamento é (ou passa a ser) um
 * aporte de meta, reconcilia o progresso da meta antiga e da nova
 * ({@see UpdateGoalProgress}).
 *
 * Bloqueado pra perna de transferência ou lançamento vinculado a boleto —
 * ver {@see TransactionNotEditableException}. Não bloqueia aporte de meta
 * (esse é reconciliado); mover aporte de contexto, sim
 * ({@see MoveTransactionToContext}).
 *
 * @package App\UseCases\Transaction
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   21/08/2026
 *
 * @updated 31/08/2026
 */
final class UpdateTransaction
{
    public function __construct(private readonly UpdateGoalProgress $updateGoalProgress) {}

    /** @throws TransactionNotEditableException */
    public function execute(StatementEntry $entry, UpdateTransactionData $data): StatementEntry
    {
        if ($entry->transfer_pair_id !== null || $entry->bill_id !== null || $entry->card_invoice_id !== null) {
            throw new TransactionNotEditableException;
        }

        return DB::transaction(function () use ($entry, $data): StatementEntry {
            // Lançamento previsto (pending) ainda não moveu saldo nem meta —
            // editar é só trocar os campos; o efeito é aplicado na
            // efetivação ({@see SettleTransaction}).
            if ($entry->isSettled()) {
                // $entry->type já vem como enum (cast no model) — comparar
                // contra o case, nunca contra ->value (ver DeleteTransaction).
                // @phpstan-ignore-next-line identical.alwaysFalse (larastan erra os dois lados dessa inferência)
                $oldSign = $entry->type === StatementEntryType::Expense ? -1 : 1;
                Account::query()->whereKey($entry->account_id)->lockForUpdate()
                    ->increment('balance', -1 * $oldSign * (float) $entry->amount);

                $newSign = $data->type === StatementEntryType::Expense ? -1 : 1;
                Account::query()->whereKey($data->accountId)->lockForUpdate()
                    ->increment('balance', $newSign * $data->amount);

                $this->reconcileGoals($entry, $data);
            }

            $entry->update([
                'account_id' => $data->accountId,
                'category_id' => $data->categoryId,
                'goal_id' => $data->goalId,
                'description' => $data->description,
                'amount' => $data->amount,
                'type' => $data->type->value,
                'occurred_at' => $data->occurredAt,
            ]);

            return $entry->fresh();
        });
    }

    /**
     * Tira o valor do aporte antigo da meta antiga e soma o novo na meta
     * nova — cobre trocar de meta, sair de meta (`goalId` nulo) ou só
     * mudar o valor do aporte na mesma meta.
     */
    private function reconcileGoals(StatementEntry $entry, UpdateTransactionData $data): void
    {
        if ($entry->goal_id !== null) {
            /** @var Goal $old */
            $old = Goal::query()->whereKey($entry->goal_id)->lockForUpdate()->firstOrFail();
            $this->updateGoalProgress->execute($old, -(float) $entry->amount);
        }

        if ($data->goalId !== null) {
            /** @var Goal $new */
            $new = Goal::query()->whereKey($data->goalId)->lockForUpdate()->firstOrFail();
            $this->updateGoalProgress->execute($new, $data->amount);
        }
    }
}
