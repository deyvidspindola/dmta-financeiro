<?php

declare(strict_types=1);

namespace App\Jobs;

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
 * vez por dia via `schedule:run` (nunca processo permanente, ver skill
 * `padroes-laravel-dmta` seção 2). Sem recálculo automático de juros/
 * multa nesta fase (D-07 segue em aberto) — o boleto gerado só carrega o
 * valor cadastrado na regra.
 *
 * Uma regra pode ter mais de uma ocorrência vencida (ex.: sistema ficou
 * fora do ar por semanas) — o loop avança até `next_due_date` ficar no
 * futuro, gerando uma ocorrência por vez, nunca pulando nenhuma. Erro
 * numa regra não impede as outras de rodar.
 *
 * @package App\Jobs
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   22/08/2026
 *
 * @updated 22/08/2026
 */
final class GenerateRecurringBillEntries implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function handle(): void
    {
        $today = Carbon::today();

        RecurringBill::query()
            ->where('active', true)
            ->where('next_due_date', '<=', $today->toDateString())
            ->each(function (RecurringBill $rule) use ($today): void {
                try {
                    $this->materialize($rule, $today);
                } catch (Throwable $e) {
                    Log::error('Falha ao gerar ocorrência de obrigação recorrente', [
                        'recurring_bill_id' => $rule->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            });
    }

    private function materialize(RecurringBill $rule, Carbon $today): void
    {
        // $rule->next_due_date/direction/interval já vêm cast (Carbon,
        // BillDirection, RecurrenceInterval) — mesmo padrão verificado em
        // runtime de RecurringTransaction::next_occurrence_date; larastan
        // não enxerga o método casts() deste model.
        // @phpstan-ignore-next-line method.nonObject (verificado em runtime, mesmo padrão de RecurringTransaction)
        while ($rule->active && $rule->next_due_date->lte($today)) {
            $occurrence = Carbon::parse($rule->next_due_date);

            $this->materializeOccurrence($rule, $occurrence);

            // @phpstan-ignore-next-line method.nonObject (verificado em runtime)
            $next = $rule->interval->nextAfter($occurrence);

            if ($rule->end_date !== null && $next->gt($rule->end_date)) {
                $rule->update(['next_due_date' => $next, 'active' => false]);

                return;
            }

            $rule->update(['next_due_date' => $next]);
            $rule->refresh();
        }
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
