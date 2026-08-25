<?php

declare(strict_types=1);

namespace App\UseCases\Transaction;

use App\DTOs\RegisterTransactionData;
use App\Enums\BillStatus;
use App\Enums\StatementEntryType;
use App\Models\Account;
use App\Models\Bill;
use App\Models\Goal;
use App\Models\StatementEntry;
use App\UseCases\Goal\UpdateGoalProgress;
use Illuminate\Support\Facades\DB;

/**
 * Registra um lançamento numa conta e move o saldo dela na mesma
 * transação de banco. Reusado por qualquer canal de captura — só
 * `origin` muda entre manual (F0) e e-mail/Telegram (F1).
 *
 * Se `billId` vier preenchido, também marca o boleto correspondente como
 * pago — é assim que um boleto confirmado vira saldo movido, sem duplicar
 * a decisão de "isso já foi pago" em dois lugares. Se `goalId` vier
 * preenchido, soma o valor como aporte na meta ({@see UpdateGoalProgress})
 * — o lançamento continua movendo saldo normalmente, marcar a meta é só
 * rótulo (capítulo 9.7).
 *
 * @package App\UseCases\Transaction
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   21/08/2026
 *
 * @updated 25/08/2026
 */
final class RegisterTransaction
{
    public function __construct(private readonly UpdateGoalProgress $updateGoalProgress) {}

    public function execute(RegisterTransactionData $data): StatementEntry
    {
        return DB::transaction(function () use ($data): StatementEntry {
            $entry = StatementEntry::create([
                'context_id' => $data->contextId,
                'account_id' => $data->accountId,
                'category_id' => $data->categoryId,
                'bill_id' => $data->billId,
                'recurring_transaction_id' => $data->recurringTransactionId,
                'goal_id' => $data->goalId,
                'description' => $data->description,
                'amount' => $data->amount,
                'type' => $data->type->value,
                'occurred_at' => $data->occurredAt,
                'origin' => $data->origin->value,
            ]);

            $sign = $data->type === StatementEntryType::Expense ? -1 : 1;

            /** @var Account $account */
            $account = Account::query()->whereKey($data->accountId)->lockForUpdate()->firstOrFail();
            $account->increment('balance', $sign * $data->amount);

            if ($data->billId !== null) {
                Bill::query()->whereKey($data->billId)->update([
                    'status' => BillStatus::Paid->value,
                    'paid_at' => now(),
                ]);
            }

            if ($data->goalId !== null) {
                /** @var Goal $goal */
                $goal = Goal::query()->whereKey($data->goalId)->lockForUpdate()->firstOrFail();
                $this->updateGoalProgress->execute($goal, $data->amount);
            }

            return $entry;
        });
    }
}
