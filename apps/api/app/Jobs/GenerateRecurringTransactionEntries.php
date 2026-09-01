<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Domain\Recurrence\RecurrenceWindow;
use App\DTOs\RegisterTransactionData;
use App\Models\RecurringTransaction;
use App\Models\StatementEntry;
use App\UseCases\Transaction\RegisterTransaction;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Materializa em {@see StatementEntry} toda regra recorrente cuja
 * `next_occurrence_date` já venceu — roda uma vez por dia via
 * `schedule:run`. A matemática de "quais ocorrências venceram / quando é
 * a próxima / a regra acabou?" mora em {@see RecurrenceWindow},
 * compartilhada com o job de obrigações e o projetor de simulação.
 *
 * Idempotente: só materializa a ocorrência que ainda não existe; o índice
 * único `se_recurrence_occurrence_unique` é o backstop. Erro numa regra
 * não impede as outras. A data e o `active` da regra são gravados uma vez
 * por regra, depois de materializar todas as ocorrências vencidas —
 * falhar no meio só faz o próximo run retomar do começo (as já criadas
 * são puladas).
 *
 * @package App\Jobs
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 2.0.0
 *
 * @since   21/08/2026
 *
 * @updated 02/09/2026
 */
final class GenerateRecurringTransactionEntries implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function handle(RecurrenceWindow $window, RegisterTransaction $register): void
    {
        $today = Carbon::today();

        RecurringTransaction::query()
            ->where('active', true)
            ->where('next_occurrence_date', '<=', $today->toDateString())
            ->each(function (RecurringTransaction $rule) use ($window, $register, $today): void {
                try {
                    $this->process($rule, $window, $register, $today);
                } catch (Throwable $e) {
                    Log::error('Falha ao gerar ocorrência de lançamento recorrente', [
                        'recurring_transaction_id' => $rule->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            });
    }

    private function process(
        RecurringTransaction $rule,
        RecurrenceWindow $window,
        RegisterTransaction $register,
        Carbon $today,
    ): void {
        $result = $window->due(
            Carbon::parse($rule->next_occurrence_date),
            // @phpstan-ignore-next-line argument.type (cast RecurrenceInterval confirmado em runtime — larastan não infere casts())
            $rule->interval,
            $rule->end_date !== null ? Carbon::parse($rule->end_date) : null,
            $today,
        );

        foreach ($result['occurrences'] as $occurrence) {
            $this->materializeOne($rule, $register, $occurrence);
        }

        $rule->update([
            'next_occurrence_date' => $result['nextCursor'],
            'active' => ! $result['deactivate'],
        ]);
    }

    /** Cria o lançamento da ocorrência só se ele ainda não existe. */
    private function materializeOne(RecurringTransaction $rule, RegisterTransaction $register, Carbon $occurrence): void
    {
        $alreadyDone = StatementEntry::query()
            ->where('recurring_transaction_id', $rule->id)
            ->whereDate('occurred_at', $occurrence->toDateString())
            ->exists();

        if ($alreadyDone) {
            return;
        }

        try {
            $register->execute(new RegisterTransactionData(
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
