<?php

declare(strict_types=1);

namespace App\Services;

use App\Domain\Recurrence\RecurrenceWindow;
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
 * Projeta as entradas e saídas já datadas ou recorrentes de um contexto
 * que caem numa janela `[from, to]` — a base comum do fluxo de caixa
 * ({@see CashFlowProjector}, janela por dias) e do orçamento livre
 * ({@see FreeBudgetCalculator}, janela por mês). Antes cada um
 * reimplementava a mesma soma.
 *
 * Componentes:
 *  - entrada: boletos a receber (por `due_date`) + regras de lançamento
 *    recorrente do tipo receita;
 *  - saída: boletos a pagar (por `due_date`) + faturas de cartão não
 *    pagas (por `due_date`) + regras de obrigação recorrente `payable` +
 *    regras de lançamento recorrente do tipo despesa.
 *
 * NÃO inclui: dívidas pendentes (`Debt` — sem recorrência própria, ver
 * docblock dela), média de receita histórica (isso é do
 * `FreeBudgetCalculator`), nem saldo atual das contas.
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   02/09/2026
 *
 * @updated 02/09/2026
 */
final class MonthlyFlowProjector
{
    public function __construct(private readonly RecurrenceWindow $window) {}

    /**
     * @return array{income: float, expense: float}
     */
    public function between(Context $context, Carbon $from, Carbon $to): array
    {
        return [
            'income' => $this->receivableBills($context, $from, $to)
                + $this->recurringByType($context, StatementEntryType::Income, $from, $to),
            'expense' => $this->payableBills($context, $from, $to)
                + $this->unpaidCardInvoices($context, $from, $to)
                + $this->recurringPayableObligations($context, $from, $to)
                + $this->recurringByType($context, StatementEntryType::Expense, $from, $to),
        ];
    }

    private function receivableBills(Context $context, Carbon $from, Carbon $to): float
    {
        return $this->billsBetween($context, BillDirection::Receivable, $from, $to);
    }

    private function payableBills(Context $context, Carbon $from, Carbon $to): float
    {
        return $this->billsBetween($context, BillDirection::Payable, $from, $to);
    }

    private function billsBetween(Context $context, BillDirection $direction, Carbon $from, Carbon $to): float
    {
        return (float) $context->bills()
            ->where('status', BillStatus::Pending->value)
            ->where('direction', $direction->value)
            ->whereBetween('due_date', [$from->toDateString(), $to->toDateString()])
            ->sum('amount');
    }

    private function unpaidCardInvoices(Context $context, Carbon $from, Carbon $to): float
    {
        return (float) CardInvoice::query()
            ->whereIn('credit_card_id', $context->creditCards()->select('id'))
            ->whereIn('status', [CardInvoiceStatus::Open->value, CardInvoiceStatus::Closed->value])
            ->whereBetween('due_date', [$from->toDateString(), $to->toDateString()])
            ->sum('total_amount');
    }

    private function recurringPayableObligations(Context $context, Carbon $from, Carbon $to): float
    {
        $total = 0.0;

        $rules = $context->recurringBills()
            ->where('active', true)
            ->where('direction', BillDirection::Payable->value)
            ->get();

        /** @var RecurringBill $rule */
        foreach ($rules as $rule) {
            $total += $this->window->sumInRange(
                Carbon::parse($rule->next_due_date),
                // @phpstan-ignore-next-line argument.type (cast RecurrenceInterval confirmado em runtime)
                $rule->interval,
                $rule->end_date !== null ? Carbon::parse($rule->end_date) : null,
                (float) $rule->amount,
                $from,
                $to,
            );
        }

        return $total;
    }

    private function recurringByType(Context $context, StatementEntryType $type, Carbon $from, Carbon $to): float
    {
        $total = 0.0;

        $rules = $context->recurringTransactions()
            ->where('active', true)
            ->where('type', $type->value)
            ->get();

        /** @var RecurringTransaction $rule */
        foreach ($rules as $rule) {
            $total += $this->window->sumInRange(
                Carbon::parse($rule->next_occurrence_date),
                // @phpstan-ignore-next-line argument.type (cast RecurrenceInterval confirmado em runtime)
                $rule->interval,
                $rule->end_date !== null ? Carbon::parse($rule->end_date) : null,
                (float) $rule->amount,
                $from,
                $to,
            );
        }

        return $total;
    }
}
