<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\RecurringBill;
use App\Services\RecurringBillMaterializer;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Materializa em `Bill` (`status: pending`) toda regra de obrigação
 * recorrente (DARF/DAS e afins) cuja `next_due_date` já venceu — roda uma
 * vez por dia via `schedule:run`. A materialização em si mora em
 * {@see RecurringBillMaterializer} (compartilhada com o cadastro da
 * regra, que já materializa a ocorrência corrente na hora).
 *
 * @package App\Jobs
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 3.0.0
 *
 * @since   22/08/2026
 *
 * @updated 22/09/2026
 */
final class GenerateRecurringBillEntries implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function handle(RecurringBillMaterializer $materializer): void
    {
        $today = Carbon::today();

        RecurringBill::query()
            ->where('active', true)
            ->where('next_due_date', '<=', $today->toDateString())
            ->each(function (RecurringBill $rule) use ($materializer, $today): void {
                try {
                    $materializer->materializeDue($rule, $today);
                } catch (Throwable $e) {
                    Log::error('Falha ao gerar ocorrência de obrigação recorrente', [
                        'recurring_bill_id' => $rule->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            });
    }
}
