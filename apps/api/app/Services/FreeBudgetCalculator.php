<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\DebtDirection;
use App\Enums\DebtStatus;
use App\Enums\StatementEntryType;
use App\Models\Context;
use App\Models\Debt;
use App\UseCases\Simulation\SimulateInstallmentPurchase;
use Illuminate\Support\Carbon;

/**
 * Orçamento livre de um contexto (capítulo 9.1, D-04): receita média
 * recente − tudo que já está datado ou é recorrente saindo no mês
 * ({@see MonthlyFlowProjector}) − dívidas já assumidas. Reusado pelo
 * simulador ({@see SimulateInstallmentPurchase}) e pelo fluxo de caixa.
 *
 * `forMonth()` projeta um mês qualquer só com o que já está datado —
 * nunca inclui dívidas pendentes, porque elas não têm recorrência mensal
 * própria (ver {@see Debt}) e subtraí-las em todo mês futuro contaria o
 * mesmo compromisso repetidas vezes. Dívidas só entram no retrato do mês
 * atual, em `forCurrentMonth()`.
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 2.0.0
 *
 * @since   25/08/2026
 *
 * @updated 02/09/2026
 */
final class FreeBudgetCalculator
{
    private const INCOME_AVERAGE_MONTHS = 3;

    public function __construct(private readonly MonthlyFlowProjector $flow) {}

    public function forCurrentMonth(Context $context): float
    {
        return $this->forMonth($context, Carbon::now()) - $this->pendingDebtsTotal($context);
    }

    public function forMonth(Context $context, Carbon $month): float
    {
        $flow = $this->flow->between(
            $context,
            $month->copy()->startOfMonth(),
            $month->copy()->endOfMonth(),
        );

        return $this->averageMonthlyIncome($context) - $flow['expense'];
    }

    private function averageMonthlyIncome(Context $context): float
    {
        $start = Carbon::now()->startOfMonth()->subMonths(self::INCOME_AVERAGE_MONTHS);
        $total = (float) $context->statementEntries()
            ->settled()
            ->where('type', StatementEntryType::Income->value)
            ->where('occurred_at', '>=', $start->toDateString())
            ->sum('amount');

        return $total / self::INCOME_AVERAGE_MONTHS;
    }

    private function pendingDebtsTotal(Context $context): float
    {
        return (float) $context->debts()
            ->where('status', DebtStatus::Pending->value)
            ->where('direction', DebtDirection::IOwe->value)
            ->sum('amount');
    }
}
