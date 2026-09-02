<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\StatementEntryType;
use App\Models\Budget;
use App\Models\Context;
use App\Models\StatementEntry;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * O detalhe de um orçamento: a lista do que está consumindo o teto de
 * uma categoria num mês — lançamentos já efetivados (`effective: true`) e
 * o previsto (`effective: false`: boleto, compra de cartão, recorrência),
 * vindo do {@see BudgetProjectionService}. Inclui as subcategorias de 1
 * nível (D-12), como o {@see BudgetProgressService}.
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
final class BudgetConsumptionService
{
    public function __construct(private readonly BudgetProjectionService $projection) {}

    /**
     * @return array{budget_id: int, category_id: int, category_name: string, limit: float, spent: float, spent_effective: float, month: string, items: list<array<string, mixed>>}
     */
    public function forBudget(Context $context, Budget $budget, Carbon $month): array
    {
        $monthStart = $month->copy()->startOfMonth();
        $categoryIds = $this->categoryTree($context, $budget->category_id);
        $names = $context->categories()->whereIn('id', $categoryIds)->pluck('name', 'id');

        $items = [];

        foreach ($this->effectiveEntries($context, $categoryIds, $monthStart) as $entry) {
            $items[] = [
                'kind' => 'transaction',
                'effective' => true,
                'description' => $entry->description,
                'category_id' => (int) $entry->category_id,
                'category_name' => $names[$entry->category_id] ?? null,
                'amount' => (float) $entry->amount,
                'date' => $this->day($entry->occurred_at),
            ];
        }

        foreach ($this->projection->pendingItems($context, $monthStart) as $pending) {
            if (! in_array($pending['category_id'], $categoryIds, true)) {
                continue;
            }

            $items[] = [
                'kind' => $pending['kind'],
                'effective' => false,
                'description' => $pending['description'],
                'category_id' => $pending['category_id'],
                'category_name' => $names[$pending['category_id']] ?? null,
                'amount' => $pending['amount'],
                'date' => $pending['date'],
            ];
        }

        usort($items, fn (array $a, array $b): int => strcmp($b['date'], $a['date']));

        $effectiveTotal = $this->sum(array_filter($items, fn (array $i): bool => $i['effective'] === true));

        return [
            'budget_id' => $budget->id,
            'category_id' => (int) $budget->category_id,
            'category_name' => $names[$budget->category_id] ?? '',
            'limit' => (float) $budget->limit_amount,
            'spent' => $this->sum($items),
            'spent_effective' => $effectiveTotal,
            'month' => $monthStart->format('Y-m'),
            'items' => $items,
        ];
    }

    /**
     * A categoria do teto + as subcategorias diretas dela (1 nível).
     *
     * @return list<int>
     */
    private function categoryTree(Context $context, int $categoryId): array
    {
        $children = $context->categories()->where('parent_id', $categoryId)->pluck('id')->all();

        return array_map('intval', array_merge([$categoryId], $children));
    }

    /**
     * @param  list<int>  $categoryIds
     * @return Collection<int, StatementEntry>
     */
    private function effectiveEntries(Context $context, array $categoryIds, Carbon $monthStart): Collection
    {
        return $context->statementEntries()
            ->where('type', StatementEntryType::Expense->value)
            ->whereIn('category_id', $categoryIds)
            ->whereYear('occurred_at', $monthStart->year)
            ->whereMonth('occurred_at', $monthStart->month)
            ->orderByDesc('occurred_at')
            ->get();
    }

    /** @param  iterable<array{amount: float}>  $items */
    private function sum(iterable $items): float
    {
        $total = 0.0;
        foreach ($items as $item) {
            $total += $item['amount'];
        }

        return round($total, 2);
    }

    private function day(mixed $value): string
    {
        return Carbon::parse((string) $value)->toDateString();
    }
}
