<?php

declare(strict_types=1);

namespace App\Services;

use App\Domain\Recurrence\RecurrenceWindow;
use App\Enums\BillDirection;
use App\Enums\BillStatus;
use App\Enums\CardInvoiceStatus;
use App\Enums\StatementEntryType;
use App\Models\Bill;
use App\Models\CardPurchase;
use App\Models\Context;
use App\Models\RecurringBill;
use App\Models\RecurringTransaction;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Despesa do mês que ainda NÃO virou lançamento — o "previsto" que o
 * {@see BudgetProgressService} soma ao já gasto (item #3) e que o
 * {@see BudgetConsumptionService} lista no detalhe do orçamento: boletos a
 * pagar pendentes, compras de cartão em faturas não pagas e as ocorrências
 * recorrentes que o cursor da regra ainda não passou (logo, não
 * materializadas).
 *
 * Item sem categoria é ignorado — não bate em nenhum teto.
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 2.0.0
 *
 * @since   02/09/2026
 *
 * @updated 02/09/2026
 */
final class BudgetProjectionService
{
    public function __construct(private readonly RecurrenceWindow $window) {}

    /**
     * Cada despesa prevista do mês como uma linha.
     *
     * @return list<array{kind: string, category_id: int, description: string, amount: float, date: string}>
     */
    public function pendingItems(Context $context, Carbon $monthStart): array
    {
        $from = $monthStart->copy()->startOfMonth();
        $to = $monthStart->copy()->endOfMonth();

        $items = [];
        $push = function (string $kind, ?int $categoryId, ?string $description, float $amount, string $date) use (&$items): void {
            if ($categoryId !== null && $amount > 0.0) {
                $items[] = [
                    'kind' => $kind,
                    'category_id' => $categoryId,
                    'description' => $description ?? '',
                    'amount' => round($amount, 2),
                    'date' => $date,
                ];
            }
        };

        foreach ($this->payableBills($context, $from, $to) as $bill) {
            $push('bill', $bill->category_id, $bill->description, (float) $bill->amount, $this->day($bill->due_date));
        }

        foreach ($this->unpaidCardPurchases($context, $from, $to) as $purchase) {
            $push('card_purchase', $purchase->category_id, $purchase->description, (float) $purchase->amount, $this->day($purchase->occurred_at));
        }

        foreach ($context->recurringTransactions()->where('active', true)->where('type', StatementEntryType::Expense->value)->get() as $rule) {
            foreach ($this->occurrences($rule->next_occurrence_date, $rule, $from, $to) as $date) {
                $push('recurring_transaction', $rule->category_id, $rule->description, (float) $rule->amount, $date);
            }
        }

        foreach ($context->recurringBills()->where('active', true)->where('direction', BillDirection::Payable->value)->get() as $rule) {
            foreach ($this->occurrences($rule->next_due_date, $rule, $from, $to) as $date) {
                $push('recurring_bill', $rule->category_id, $rule->description, (float) $rule->amount, $date);
            }
        }

        return $items;
    }

    /**
     * @return array<int, float> category_id => valor previsto no mês
     */
    public function pendingByCategory(Context $context, Carbon $monthStart): array
    {
        $totals = [];

        foreach ($this->pendingItems($context, $monthStart) as $item) {
            $totals[$item['category_id']] = ($totals[$item['category_id']] ?? 0.0) + $item['amount'];
        }

        return array_map(fn (float $value): float => round($value, 2), $totals);
    }

    /** @return Collection<int, Bill> */
    private function payableBills(Context $context, Carbon $from, Carbon $to): Collection
    {
        return $context->bills()
            ->where('status', BillStatus::Pending->value)
            ->where('direction', BillDirection::Payable->value)
            ->whereNotNull('category_id')
            ->whereBetween('due_date', [$from->toDateString(), $to->toDateString()])
            ->get();
    }

    /** @return Collection<int, CardPurchase> */
    private function unpaidCardPurchases(Context $context, Carbon $from, Carbon $to): Collection
    {
        return CardPurchase::query()
            ->where('context_id', $context->id)
            ->whereNotNull('category_id')
            ->whereHas('cardInvoice', fn ($query) => $query
                ->whereIn('status', [CardInvoiceStatus::Open->value, CardInvoiceStatus::Closed->value])
                ->whereBetween('due_date', [$from->toDateString(), $to->toDateString()]))
            ->get();
    }

    /**
     * Datas (Y-m-d) das ocorrências de uma regra recorrente na janela.
     *
     * @return list<string>
     */
    private function occurrences(mixed $cursor, RecurringBill|RecurringTransaction $rule, Carbon $from, Carbon $to): array
    {
        $dates = $this->window->occurrencesInRange(
            Carbon::parse((string) $cursor),
            // @phpstan-ignore-next-line argument.type (cast RecurrenceInterval confirmado em runtime)
            $rule->interval,
            $rule->end_date !== null ? Carbon::parse($rule->end_date) : null,
            $from,
            $to,
        );

        return array_map(fn (Carbon $date): string => $date->toDateString(), $dates);
    }

    /** `Y-m-d` de um atributo de data do model (cast que o larastan não infere). */
    private function day(mixed $value): string
    {
        return Carbon::parse((string) $value)->toDateString();
    }
}
