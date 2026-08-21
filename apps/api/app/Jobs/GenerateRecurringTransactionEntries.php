<?php

declare(strict_types=1);

namespace App\Jobs;

use App\DTOs\RegisterTransactionData;
use App\Models\RecurringTransaction;
use App\Models\StatementEntry;
use App\UseCases\Transaction\RegisterTransaction;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Materializa em {@see StatementEntry} toda regra recorrente
 * cuja `next_occurrence_date` já venceu — roda uma vez por dia via
 * `schedule:run` (nunca processo permanente, ver skill
 * `padroes-laravel-dmta` seção 2). Reusa {@see RegisterTransaction}, o
 * mesmo caso de uso do lançamento manual, só muda a origem dos dados.
 *
 * Uma regra pode ter mais de uma ocorrência vencida (ex.: sistema ficou
 * fora do ar por semanas) — o loop avança até `next_occurrence_date`
 * ficar no futuro, gerando uma ocorrência por vez, nunca pulando nenhuma.
 * Erro numa regra não impede as outras de rodar.
 *
 * @package App\Jobs
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final class GenerateRecurringTransactionEntries implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function handle(RegisterTransaction $useCase): void
    {
        $today = Carbon::today();

        RecurringTransaction::query()
            ->where('active', true)
            ->where('next_occurrence_date', '<=', $today->toDateString())
            ->each(function (RecurringTransaction $rule) use ($useCase, $today): void {
                try {
                    $this->materialize($rule, $useCase, $today);
                } catch (Throwable $e) {
                    Log::error('Falha ao gerar ocorrência de lançamento recorrente', [
                        'recurring_transaction_id' => $rule->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            });
    }

    private function materialize(RecurringTransaction $rule, RegisterTransaction $useCase, Carbon $today): void
    {
        // $rule->next_occurrence_date/type/interval já vêm cast (Carbon,
        // StatementEntryType, RecurrenceInterval — confirmado em runtime
        // via Tinker, gettype()/get_class()); larastan não enxerga o
        // método casts() deste model e trata como string cru.
        // @phpstan-ignore-next-line method.nonObject (verificado em runtime)
        while ($rule->active && $rule->next_occurrence_date->lte($today)) {
            $occurrence = $rule->next_occurrence_date;

            $useCase->execute(new RegisterTransactionData(
                contextId: $rule->context_id,
                accountId: $rule->account_id,
                description: $rule->description,
                amount: (float) $rule->amount,
                // @phpstan-ignore-next-line argument.type (verificado em runtime)
                type: $rule->type,
                // @phpstan-ignore-next-line method.nonObject (verificado em runtime)
                occurredAt: $occurrence->toDateString(),
                categoryId: $rule->category_id,
                recurringTransactionId: $rule->id,
            ));

            // @phpstan-ignore-next-line method.nonObject (verificado em runtime)
            $next = $rule->interval->nextAfter($occurrence);

            if ($rule->end_date !== null && $next->gt($rule->end_date)) {
                $rule->update(['next_occurrence_date' => $next, 'active' => false]);

                return;
            }

            $rule->update(['next_occurrence_date' => $next]);
            $rule->refresh();
        }
    }
}
