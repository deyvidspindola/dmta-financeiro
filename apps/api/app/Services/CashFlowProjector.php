<?php

declare(strict_types=1);

namespace App\Services;

use App\Domain\Simulation\RecurringOccurrenceProjector;
use App\Enums\BillDirection;
use App\Enums\BillStatus;
use App\Enums\CardInvoiceStatus;
use App\Enums\StatementEntryType;
use App\Models\CardInvoice;
use App\Models\Context;
use App\Models\RecurringBill;
use App\Models\RecurringTransaction;
use Illuminate\Support\Carbon;

/**
 * Fluxo de caixa futuro (capítulo 9.3, D-04): entradas e saídas já
 * cadastradas (boletos, faturas, regras recorrentes), cruzadas com o
 * saldo atual das contas — "vou ter saldo suficiente daqui a X dias?".
 * Mesmo dado do dashboard, só que olhado no tempo em vez de no total;
 * nenhuma integração nova (ver capítulo 9.3 do documento de concepção).
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
final class CashFlowProjector
{
    /** Horizontes fixos da tela (capítulo 9.3) — não é `?days=` livre, o valor de mostrar os três juntos é comparar. */
    private const HORIZON_DAYS = [7, 30, 90];

    public function __construct(private readonly RecurringOccurrenceProjector $projector) {}

    /** @return list<array{days: int, income: float, expense: float, projected_balance: float}> */
    public function project(Context $context): array
    {
        $today = Carbon::today();
        $currentBalance = (float) $context->accounts()->sum('balance');

        return array_map(function (int $days) use ($context, $today, $currentBalance): array {
            $until = $today->copy()->addDays($days);
            $income = $this->incomeUntil($context, $today, $until);
            $expense = $this->expenseUntil($context, $today, $until);

            return [
                'days' => $days,
                'income' => round($income, 2),
                'expense' => round($expense, 2),
                'projected_balance' => round($currentBalance + $income - $expense, 2),
            ];
        }, self::HORIZON_DAYS);
    }

    private function incomeUntil(Context $context, Carbon $from, Carbon $until): float
    {
        $bills = (float) $context->bills()
            ->where('status', BillStatus::Pending->value)
            ->where('direction', BillDirection::Receivable->value)
            ->whereBetween('due_date', [$from->toDateString(), $until->toDateString()])
            ->sum('amount');

        $recurring = 0.0;

        /** @var RecurringTransaction $rule */
        foreach ($context->recurringTransactions()->where('active', true)->where('type', StatementEntryType::Income->value)->get() as $rule) {
            // @phpstan-ignore-next-line argument.type (next_occurrence_date/interval/end_date já vêm cast — larastan não infere casts() aqui)
            $recurring += $this->projector->sumInRange($rule->next_occurrence_date, $rule->interval, $rule->end_date, (float) $rule->amount, $from, $until);
        }

        return $bills + $recurring;
    }

    private function expenseUntil(Context $context, Carbon $from, Carbon $until): float
    {
        $bills = (float) $context->bills()
            ->where('status', BillStatus::Pending->value)
            ->where('direction', BillDirection::Payable->value)
            ->whereBetween('due_date', [$from->toDateString(), $until->toDateString()])
            ->sum('amount');

        $cardIds = $context->creditCards()->pluck('id');
        $invoices = (float) CardInvoice::query()
            ->whereIn('credit_card_id', $cardIds)
            ->whereIn('status', [CardInvoiceStatus::Open->value, CardInvoiceStatus::Closed->value])
            ->whereBetween('due_date', [$from->toDateString(), $until->toDateString()])
            ->sum('total_amount');

        $recurringBills = 0.0;

        /** @var RecurringBill $rule */
        foreach ($context->recurringBills()->where('active', true)->where('direction', BillDirection::Payable->value)->get() as $rule) {
            // @phpstan-ignore-next-line argument.type (next_due_date/interval/end_date já vêm cast — larastan não infere casts() aqui)
            $recurringBills += $this->projector->sumInRange($rule->next_due_date, $rule->interval, $rule->end_date, (float) $rule->amount, $from, $until);
        }

        $recurringTransactions = 0.0;

        /** @var RecurringTransaction $rule */
        foreach ($context->recurringTransactions()->where('active', true)->where('type', StatementEntryType::Expense->value)->get() as $rule) {
            // @phpstan-ignore-next-line argument.type (next_occurrence_date/interval/end_date já vêm cast — larastan não infere casts() aqui)
            $recurringTransactions += $this->projector->sumInRange($rule->next_occurrence_date, $rule->interval, $rule->end_date, (float) $rule->amount, $from, $until);
        }

        return $bills + $invoices + $recurringBills + $recurringTransactions;
    }
}
