<?php

declare(strict_types=1);

namespace App\Services;

use App\Domain\Recurrence\RecurrenceWindow;
use App\DTOs\RegisterTransactionData;
use App\Models\RecurringTransaction;
use App\Models\StatementEntry;
use App\UseCases\Transaction\RegisterRecurringTransaction;
use App\UseCases\Transaction\RegisterTransaction;
use Illuminate\Database\QueryException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * Materializa em {@see StatementEntry} as ocorrências vencidas de uma
 * regra de lançamento recorrente e avança o cursor da regra.
 *
 * Extraído do job `GenerateRecurringTransactionEntries` porque passou a
 * ter dois donos: o job diário (varre todas as regras) e o caso de uso
 * {@see RegisterRecurringTransaction}, que
 * materializa na hora a ocorrência do mês corrente ao cadastrar a regra —
 * sem isso o lançamento só apareceria no dia seguinte, depois do cron.
 *
 * A matemática de "quais ocorrências venceram / qual o próximo cursor /
 * a regra acabou?" continua em {@see RecurrenceWindow}. Não abre transação
 * própria: cada ocorrência é gravada pela transação de {@see RegisterTransaction}.
 * Idempotente: ocorrência já gravada é pulada (checagem + índice único
 * `se_recurrence_occurrence_unique` como backstop).
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   01/09/2026
 *
 * @updated 01/09/2026
 */
final class RecurringTransactionMaterializer
{
    public function __construct(
        private readonly RecurrenceWindow $window,
        private readonly RegisterTransaction $register,
    ) {}

    /**
     * Gera as ocorrências de `$rule` até `$asOf` (inclusive) e grava o
     * novo `next_occurrence_date` / `active` uma única vez ao final.
     *
     * @param  RecurringTransaction  $rule  Regra ativa a processar.
     * @param  Carbon  $asOf  Data-limite — normalmente hoje.
     */
    public function materializeDue(RecurringTransaction $rule, Carbon $asOf): void
    {
        $result = $this->window->due(
            Carbon::parse($rule->next_occurrence_date),
            // @phpstan-ignore-next-line argument.type (cast RecurrenceInterval confirmado em runtime — larastan não infere casts())
            $rule->interval,
            $rule->end_date !== null ? Carbon::parse($rule->end_date) : null,
            $asOf,
        );

        foreach ($result['occurrences'] as $occurrence) {
            $this->materializeOne($rule, $occurrence);
        }

        $rule->update([
            'next_occurrence_date' => $result['nextCursor'],
            'active' => ! $result['deactivate'],
        ]);
    }

    /** Cria o lançamento da ocorrência só se ele ainda não existe. */
    private function materializeOne(RecurringTransaction $rule, Carbon $occurrence): void
    {
        $alreadyDone = StatementEntry::query()
            ->where('recurring_transaction_id', $rule->id)
            ->whereDate('occurred_at', $occurrence->toDateString())
            ->exists();

        if ($alreadyDone) {
            return;
        }

        try {
            $this->register->execute(new RegisterTransactionData(
                contextId: $rule->context_id,
                accountId: $rule->account_id,
                description: $rule->description,
                amount: (float) $rule->amount,
                // @phpstan-ignore-next-line argument.type (verificado em runtime)
                type: $rule->type,
                occurredAt: $occurrence->toDateString(),
                categoryId: $rule->category_id,
                recurringTransactionId: $rule->id,
            ));
        } catch (QueryException) {
            Log::warning('Ocorrência de lançamento recorrente já existia (índice único)', [
                'recurring_transaction_id' => $rule->id,
                'occurred_at' => $occurrence->toDateString(),
            ]);
        }
    }
}
