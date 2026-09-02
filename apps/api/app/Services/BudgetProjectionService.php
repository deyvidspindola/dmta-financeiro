<?php

declare(strict_types=1);

namespace App\Services;

use App\Domain\Recurrence\RecurrenceWindow;
use App\Enums\BillDirection;
use App\Enums\BillStatus;
use App\Enums\CardInvoiceStatus;
use App\Enums\StatementEntryType;
use App\Models\CardPurchase;
use App\Models\Context;
use App\Models\RecurringBill;
use App\Models\RecurringTransaction;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Despesa do mês que ainda NÃO virou lançamento, por `category_id` — o
 * "previsto" que o {@see BudgetProgressService} soma ao já gasto para dar
 * o progresso do orçamento (item #3): boletos a pagar pendentes, compras
 * de cartão em faturas não pagas e as ocorrências recorrentes que o
 * cursor da regra ainda não passou (logo, não materializadas).
 *
 * Categoria nula é ignorada — não bate em nenhum teto.
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
final class BudgetProjectionService
{
    public function __construct(private readonly RecurrenceWindow $window) {}

    /**
     * @return array<int, float> category_id => valor previsto no mês
     */
    public function pendingByCategory(Context $context, Carbon $monthStart): array
    {
        $from = $monthStart->copy()->startOfMonth();
        $to = $monthStart->copy()->endOfMonth();

        $totals = [];
        $add = function (?int $categoryId, float $amount) use (&$totals): void {
            if ($categoryId !== null && $amount > 0.0) {
                $totals[$categoryId] = ($totals[$categoryId] ?? 0.0) + $amount;
            }
        };

        foreach ($this->pendingPayableBills($context, $from, $to) as $categoryId => $total) {
            $add((int) $categoryId, (float) $total);
        }

        foreach ($this->unpaidCardPurchases($context, $from, $to) as $categoryId => $total) {
            $add((int) $categoryId, (float) $total);
        }

        foreach ($context->recurringBills()->where('active', true)->where('direction', BillDirection::Payable->value)->get() as $rule) {
            $add($rule->category_id, $this->occurrencesInRange($rule->next_due_date, $rule, $from, $to));
        }

        foreach ($context->recurringTransactions()->where('active', true)->where('type', StatementEntryType::Expense->value)->get() as $rule) {
            $add($rule->category_id, $this->occurrencesInRange($rule->next_occurrence_date, $rule, $from, $to));
        }

        return array_map(fn (float $v): float => round($v, 2), $totals);
    }

    /** @return Collection<int, string>  category_id => soma */
    private function pendingPayableBills(Context $context, Carbon $from, Carbon $to): Collection
    {
        return $context->bills()
            ->where('status', BillStatus::Pending->value)
            ->where('direction', BillDirection::Payable->value)
            ->whereNotNull('category_id')
            ->whereBetween('due_date', [$from->toDateString(), $to->toDateString()])
            ->selectRaw('category_id, SUM(amount) as total')
            ->groupBy('category_id')
            ->pluck('total', 'category_id');
    }

    /** @return Collection<int, string>  category_id => soma */
    private function unpaidCardPurchases(Context $context, Carbon $from, Carbon $to): Collection
    {
        return CardPurchase::query()
            ->where('card_purchases.context_id', $context->id)
            ->whereNotNull('card_purchases.category_id')
            ->whereHas('cardInvoice', fn ($query) => $query
                ->whereIn('status', [CardInvoiceStatus::Open->value, CardInvoiceStatus::Closed->value])
                ->whereBetween('due_date', [$from->toDateString(), $to->toDateString()]))
            ->selectRaw('card_purchases.category_id, SUM(card_purchases.amount) as total')
            ->groupBy('card_purchases.category_id')
            ->pluck('total', 'card_purchases.category_id');
    }

    /** Soma das ocorrências de uma regra recorrente (bill ou transaction) que caem em `[from, to]`. */
    private function occurrencesInRange(mixed $cursor, RecurringBill|RecurringTransaction $rule, Carbon $from, Carbon $to): float
    {
        return $this->window->sumInRange(
            Carbon::parse((string) $cursor),
            // @phpstan-ignore-next-line argument.type (cast RecurrenceInterval confirmado em runtime)
            $rule->interval,
            $rule->end_date !== null ? Carbon::parse($rule->end_date) : null,
            (float) $rule->amount,
            $from,
            $to,
        );
    }
}
