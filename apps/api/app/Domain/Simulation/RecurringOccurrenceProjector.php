<?php

declare(strict_types=1);

namespace App\Domain\Simulation;

use App\Domain\Recurrence\RecurrenceWindow;
use App\Enums\RecurrenceInterval;
use App\Services\CashFlowProjector;
use App\Services\FreeBudgetCalculator;
use Illuminate\Support\Carbon;

/**
 * @deprecated desde 02/09/2026 — use {@see RecurrenceWindow::sumInRange()}
 * direto. Este wrapper fino só existe enquanto {@see FreeBudgetCalculator}
 * e {@see CashFlowProjector} não migram (fase A4).
 *
 * @package App\Domain\Simulation
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 2.0.0
 *
 * @since   25/08/2026
 *
 * @updated 02/09/2026
 */
final class RecurringOccurrenceProjector
{
    public function __construct(private readonly RecurrenceWindow $window) {}

    public function sumInRange(
        Carbon $next,
        RecurrenceInterval $interval,
        ?Carbon $ruleEndDate,
        float $amount,
        Carbon $rangeStart,
        Carbon $rangeEnd,
    ): float {
        return $this->window->sumInRange($next, $interval, $ruleEndDate, $amount, $rangeStart, $rangeEnd);
    }
}
