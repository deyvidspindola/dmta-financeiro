<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Domain\Recurrence\RecurrenceWindow;
use App\Enums\BillStatus;
use App\Models\Bill;
use App\Models\RecurringBill;
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
 * Materializa em {@see Bill} (`status: pending`) toda regra de obrigação
 * recorrente (DARF/DAS e afins) cuja `next_due_date` já venceu — roda uma
 * vez por dia via `schedule:run`. Sem recálculo automático de juros/multa
 * (D-07 segue em aberto).
 *
 * A matemática de ocorrências vencidas / próxima data / fim da regra mora
 * em {@see RecurrenceWindow} (compartilhada com o job de lançamentos e o
 * projetor de simulação). Idempotente pelo índice único
 * `bills_recurrence_occurrence_unique`; erro numa regra não trava as
 * outras.
 *
 * @package App\Jobs
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 2.0.0
 *
 * @since   22/08/2026
 *
 * @updated 02/09/2026
 */
final class GenerateRecurringBillEntries implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function handle(RecurrenceWindow $window): void
    {
        $today = Carbon::today();

        RecurringBill::query()
            ->where('active', true)
            ->where('next_due_date', '<=', $today->toDateString())
            ->each(function (RecurringBill $rule) use ($window, $today): void {
                try {
                    $this->process($rule, $window, $today);
                } catch (Throwable $e) {
                    Log::error('Falha ao gerar ocorrência de obrigação recorrente', [
                        'recurring_bill_id' => $rule->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            });
    }

    private function process(RecurringBill $rule, RecurrenceWindow $window, Carbon $today): void
    {
        $result = $window->due(
            Carbon::parse($rule->next_due_date),
            // @phpstan-ignore-next-line argument.type (cast RecurrenceInterval confirmado em runtime — larastan não infere casts())
            $rule->interval,
            $rule->end_date !== null ? Carbon::parse($rule->end_date) : null,
            $today,
        );

        foreach ($result['occurrences'] as $occurrence) {
            $this->materializeOccurrence($rule, $occurrence);
        }

        $rule->update([
            'next_due_date' => $result['nextCursor'],
            'active' => ! $result['deactivate'],
        ]);
    }

    /**
     * Cria o `Bill` da ocorrência só se ainda não existe (regra + data).
     * O `exists()` cobre o replay; o `catch` cobre a corrida contra o
     * índice único `bills_recurrence_occurrence_unique`.
     */
    private function materializeOccurrence(RecurringBill $rule, Carbon $occurrence): void
    {
        $alreadyMaterialized = Bill::query()
            ->where('recurring_bill_id', $rule->id)
            ->whereDate('due_date', $occurrence->toDateString())
            ->exists();

        if ($alreadyMaterialized) {
            return;
        }

        try {
            Bill::create([
                'context_id' => $rule->context_id,
                'category_id' => $rule->category_id,
                'recurring_bill_id' => $rule->id,
                'description' => $rule->description,
                'amount' => $rule->amount,
                'due_date' => $occurrence->toDateString(),
                // @phpstan-ignore-next-line property.nonObject (verificado em runtime)
                'direction' => $rule->direction->value,
                'status' => BillStatus::Pending->value,
                'origin' => 'manual',
            ]);
        } catch (QueryException) {
            Log::warning('Ocorrência de obrigação recorrente já existia (índice único)', [
                'recurring_bill_id' => $rule->id,
                'due_date' => $occurrence->toDateString(),
            ]);
        }
    }
}
