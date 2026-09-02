<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\RecurringTransaction;
use App\Models\StatementEntry;
use App\Services\RecurringTransactionMaterializer;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Materializa em {@see StatementEntry} toda regra recorrente cuja
 * `next_occurrence_date` já venceu — roda uma vez por dia via
 * `schedule:run`. Quem gera as ocorrências e avança o cursor da regra é
 * {@see RecurringTransactionMaterializer} (compartilhado com o cadastro
 * de regra); o job só varre as regras vencidas e isola o erro de uma
 * para não travar as outras.
 *
 * @package App\Jobs
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 3.0.0
 *
 * @since   21/08/2026
 *
 * @updated 01/09/2026
 */
final class GenerateRecurringTransactionEntries implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function handle(RecurringTransactionMaterializer $materializer): void
    {
        $today = Carbon::today();

        RecurringTransaction::query()
            ->where('active', true)
            ->where('next_occurrence_date', '<=', $today->toDateString())
            ->each(function (RecurringTransaction $rule) use ($materializer, $today): void {
                try {
                    $materializer->materializeDue($rule, $today);
                } catch (Throwable $e) {
                    Log::error('Falha ao gerar ocorrência de lançamento recorrente', [
                        'recurring_transaction_id' => $rule->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            });
    }
}
