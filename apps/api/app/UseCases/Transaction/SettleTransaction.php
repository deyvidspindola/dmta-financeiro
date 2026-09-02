<?php

declare(strict_types=1);

namespace App\UseCases\Transaction;

use App\Enums\BillStatus;
use App\Enums\StatementEntryStatus;
use App\Enums\StatementEntryType;
use App\Models\Account;
use App\Models\Bill;
use App\Models\Goal;
use App\Models\StatementEntry;
use App\UseCases\Goal\UpdateGoalProgress;
use Illuminate\Support\Facades\DB;

/**
 * Efetiva um lançamento previsto (`pending` → `settled`): agora o dinheiro
 * entrou/saiu de fato, então move `accounts.balance`, marca o boleto
 * vinculado como pago e soma o valor na meta vinculada — exatamente o que
 * {@see RegisterTransaction} faz quando o lançamento já nasce efetivado.
 *
 * Idempotente: chamar de novo num lançamento já efetivado não faz nada.
 * Não desfaz — "voltar a previsto" seria outro caso de uso (não pedido
 * ainda). Perna de transferência sempre nasce `settled`, então nunca
 * chega aqui.
 *
 * @package App\UseCases\Transaction
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   02/09/2026
 *
 * @updated 02/09/2026
 */
final class SettleTransaction
{
    public function __construct(private readonly UpdateGoalProgress $updateGoalProgress) {}

    public function execute(StatementEntry $entry): StatementEntry
    {
        if ($entry->isSettled()) {
            return $entry;
        }

        return DB::transaction(function () use ($entry): StatementEntry {
            $entry->update([
                'status' => StatementEntryStatus::Settled->value,
                'settled_at' => now(),
            ]);

            // @phpstan-ignore-next-line identical.alwaysFalse (cast StatementEntryType confirmado em runtime — ver Models/StatementEntry.php)
            $sign = $entry->type === StatementEntryType::Expense ? -1 : 1;

            Account::query()->whereKey($entry->account_id)->lockForUpdate()
                ->increment('balance', $sign * (float) $entry->amount);

            if ($entry->bill_id !== null) {
                Bill::query()->whereKey($entry->bill_id)->update([
                    'status' => BillStatus::Paid->value,
                    'paid_at' => now(),
                ]);
            }

            if ($entry->goal_id !== null) {
                /** @var Goal $goal */
                $goal = Goal::query()->whereKey($entry->goal_id)->lockForUpdate()->firstOrFail();
                $this->updateGoalProgress->execute($goal, (float) $entry->amount);
            }

            return $entry->fresh();
        });
    }
}
