<?php

declare(strict_types=1);

namespace App\Domain\Simulation;

use App\Enums\RecurrenceInterval;
use App\Models\Bill;
use App\Models\StatementEntry;
use App\Services\CashFlowProjector;
use App\Services\FreeBudgetCalculator;
use Illuminate\Support\Carbon;

/**
 * Soma as ocorrências futuras de uma regra recorrente (obrigação ou
 * lançamento) que caem dentro de um intervalo de datas — sem tocar
 * banco, sem materializar nada em {@see Bill}/
 * {@see StatementEntry} (isso é papel dos jobs diários,
 * `GenerateRecurringBillEntries`/`GenerateRecurringTransactionEntries`).
 * Reusado por {@see FreeBudgetCalculator} (por mês) e
 * {@see CashFlowProjector} (por horizonte de dias) —
 * mesma matemática, janela diferente.
 *
 * @package App\Domain\Simulation
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   25/08/2026
 *
 * @updated 25/08/2026
 */
final class RecurringOccurrenceProjector
{
    /** Nenhuma regra plausível (nem semanal por anos) gera mais que isso dentro de uma janela de projeção razoável — limite defensivo contra regra corrompida, não um caso real esperado. */
    private const MAX_ITERATIONS = 120;

    public function sumInRange(
        Carbon $next,
        RecurrenceInterval $interval,
        ?Carbon $ruleEndDate,
        float $amount,
        Carbon $rangeStart,
        Carbon $rangeEnd,
    ): float {
        $cursor = $next->copy();
        $total = 0.0;

        for ($i = 0; $i < self::MAX_ITERATIONS && $cursor->lte($rangeEnd); $i++) {
            if ($ruleEndDate !== null && $cursor->gt($ruleEndDate)) {
                break;
            }

            if ($cursor->gte($rangeStart)) {
                $total += $amount;
            }

            $cursor = $interval->nextAfter($cursor);
        }

        return $total;
    }
}
