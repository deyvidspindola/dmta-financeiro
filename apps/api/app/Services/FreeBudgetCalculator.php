<?php

declare(strict_types=1);

namespace App\Services;

use App\Domain\Simulation\RecurringOccurrenceProjector;
use App\Enums\BillDirection;
use App\Enums\BillStatus;
use App\Enums\CardInvoiceStatus;
use App\Enums\DebtDirection;
use App\Enums\DebtStatus;
use App\Enums\StatementEntryType;
use App\Models\CardInvoice;
use App\Models\Context;
use App\Models\Debt;
use App\Models\RecurringBill;
use App\Models\RecurringTransaction;
use App\UseCases\Simulation\SimulateInstallmentPurchase;
use Illuminate\Support\Carbon;

/**
 * Orçamento livre de um contexto (capítulo 9.1, D-04): receita média
 * recente − despesas fixas recorrentes − parcelas de cartão − dívidas já
 * assumidas. Reusado pelo simulador ({@see SimulateInstallmentPurchase})
 * e indiretamente pelo fluxo de caixa ({@see CashFlowProjector}).
 *
 * `forMonth()` projeta um mês qualquer usando só o que já está datado
 * (boletos, faturas, regras recorrentes) — nunca inclui dívidas
 * pendentes, porque elas não têm recorrência mensal própria (ver
 * docblock de {@see Debt}) e subtraí-las em todo mês futuro
 * contaria o mesmo compromisso repetidas vezes. Dívidas só entram no
 * retrato do mês atual, em `forCurrentMonth()`.
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
final class FreeBudgetCalculator
{
    private const INCOME_AVERAGE_MONTHS = 3;

    public function __construct(private readonly RecurringOccurrenceProjector $projector) {}

    public function forCurrentMonth(Context $context): float
    {
        return $this->forMonth($context, Carbon::now()) - $this->pendingDebtsTotal($context);
    }

    public function forMonth(Context $context, Carbon $month): float
    {
        return $this->averageMonthlyIncome($context)
            - $this->recurringBillsDueIn($context, $month)
            - $this->recurringTransactionsDueIn($context, $month)
            - $this->billsDueIn($context, $month)
            - $this->cardInvoicesDueIn($context, $month);
    }

    private function averageMonthlyIncome(Context $context): float
    {
        $start = Carbon::now()->startOfMonth()->subMonths(self::INCOME_AVERAGE_MONTHS);
        $total = (float) $context->statementEntries()
            ->where('type', StatementEntryType::Income->value)
            ->where('occurred_at', '>=', $start->toDateString())
            ->sum('amount');

        return $total / self::INCOME_AVERAGE_MONTHS;
    }

    private function billsDueIn(Context $context, Carbon $month): float
    {
        return (float) $context->bills()
            ->where('status', BillStatus::Pending->value)
            ->where('direction', BillDirection::Payable->value)
            ->whereYear('due_date', $month->year)
            ->whereMonth('due_date', $month->month)
            ->sum('amount');
    }

    private function cardInvoicesDueIn(Context $context, Carbon $month): float
    {
        $cardIds = $context->creditCards()->pluck('id');

        return (float) CardInvoice::query()
            ->whereIn('credit_card_id', $cardIds)
            ->whereIn('status', [CardInvoiceStatus::Open->value, CardInvoiceStatus::Closed->value])
            ->whereYear('due_date', $month->year)
            ->whereMonth('due_date', $month->month)
            ->sum('total_amount');
    }

    private function recurringBillsDueIn(Context $context, Carbon $month): float
    {
        $start = $month->copy()->startOfMonth();
        $end = $month->copy()->endOfMonth();
        $total = 0.0;

        /** @var RecurringBill $rule */
        foreach ($context->recurringBills()->where('active', true)->where('direction', BillDirection::Payable->value)->get() as $rule) {
            // @phpstan-ignore-next-line argument.type (next_due_date/interval/end_date já vêm cast — larastan não infere casts() aqui, mesmo caso de GenerateRecurringBillEntries)
            $total += $this->projector->sumInRange($rule->next_due_date, $rule->interval, $rule->end_date, (float) $rule->amount, $start, $end);
        }

        return $total;
    }

    private function recurringTransactionsDueIn(Context $context, Carbon $month): float
    {
        $start = $month->copy()->startOfMonth();
        $end = $month->copy()->endOfMonth();
        $total = 0.0;

        /** @var RecurringTransaction $rule */
        foreach ($context->recurringTransactions()->where('active', true)->where('type', StatementEntryType::Expense->value)->get() as $rule) {
            // @phpstan-ignore-next-line argument.type (next_occurrence_date/interval/end_date já vêm cast — larastan não infere casts() aqui)
            $total += $this->projector->sumInRange($rule->next_occurrence_date, $rule->interval, $rule->end_date, (float) $rule->amount, $start, $end);
        }

        return $total;
    }

    private function pendingDebtsTotal(Context $context): float
    {
        return (float) $context->debts()
            ->where('status', DebtStatus::Pending->value)
            ->where('direction', DebtDirection::IOwe->value)
            ->sum('amount');
    }
}
