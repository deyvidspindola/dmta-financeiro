<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Context;
use App\UseCases\Simulation\SimulateInstallmentPurchase;
use Illuminate\Support\Carbon;

/**
 * Varre os meses seguintes cruzando uma parcela nova com o orçamento
 * livre projetado de cada um (capítulos 9.3 e 9.6) — "a partir de
 * quando cabe" e "qual mês pesa mais". Extraído de
 * {@see SimulateInstallmentPurchase} pra não
 * estourar o limite de linhas de caso de uso.
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   25/08/2026
 *
 * @updated 25/08/2026
 */
final class InstallmentScheduleScanner
{
    private const COMFORTABLE_THRESHOLD = 30.0;

    private const FIT_SEARCH_MONTHS = 12;

    private const MAX_TIGHTEST_MONTH_SCAN = 60;

    public function __construct(private readonly FreeBudgetCalculator $budgetCalculator) {}

    /** Primeiro mês (Y-m) em que a parcela cabe sem estourar o teto — `null` se não achar dentro de {@see self::FIT_SEARCH_MONTHS}. */
    public function fitsFromMonth(Context $context, float $installment, ?float $currentPercent): ?string
    {
        if ($currentPercent !== null && $currentPercent <= self::COMFORTABLE_THRESHOLD) {
            return Carbon::now()->format('Y-m');
        }

        for ($i = 1; $i <= self::FIT_SEARCH_MONTHS; $i++) {
            $month = Carbon::now()->addMonthsNoOverflow($i);
            $budget = $this->budgetCalculator->forMonth($context, $month);

            if ($budget > 0 && ($installment / $budget * 100) <= self::COMFORTABLE_THRESHOLD) {
                return $month->format('Y-m');
            }
        }

        return null;
    }

    /**
     * Mês em que a parcela pesa mais dentro do prazo do parcelamento —
     * sem orçamento livre positivo naquele mês conta como o pior caso
     * possível, não é ignorado.
     *
     * @return array{month: string, free_budget: float, commitment_percent: ?float}
     */
    public function tightestMonth(Context $context, float $installment, int $installments): array
    {
        $scanMonths = min($installments, self::MAX_TIGHTEST_MONTH_SCAN);
        $worstRank = -1.0;
        $worst = ['month' => Carbon::now()->format('Y-m'), 'free_budget' => 0.0, 'commitment_percent' => null];

        for ($i = 0; $i < $scanMonths; $i++) {
            $month = Carbon::now()->addMonthsNoOverflow($i);
            $budget = $this->budgetCalculator->forMonth($context, $month);
            $percent = $budget > 0 ? $installment / $budget * 100 : null;
            $rank = $percent ?? PHP_FLOAT_MAX;

            if ($rank > $worstRank) {
                $worstRank = $rank;
                $worst = [
                    'month' => $month->format('Y-m'),
                    'free_budget' => round($budget, 2),
                    'commitment_percent' => $percent !== null ? round($percent, 1) : null,
                ];
            }
        }

        return $worst;
    }
}
