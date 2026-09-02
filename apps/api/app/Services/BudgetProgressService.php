<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\StatementEntryType;
use App\Models\Budget;
use App\Models\Context;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Calcula o progresso dos orçamentos de um contexto num mês: para cada
 * categoria com teto, quanto vai ser gasto (a própria categoria + as
 * subcategorias dela, 1 nível — D-12) contra o teto efetivo (override do
 * mês tem precedência sobre o teto padrão).
 *
 * `spent` = já efetivado + previsto ({@see BudgetProjectionService}:
 * boletos, cartão, recorrência do mês) — item #3, "previsto em tudo".
 * `spent_effective` é só a parte que já virou lançamento.
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
final class BudgetProgressService
{
    public function __construct(private readonly BudgetProjectionService $projection) {}

    /**
     * @return list<array{budget_id: int, category_id: int, category_name: string, is_override: bool, limit: float, spent: float, spent_effective: float, remaining: float, percent: float, over: bool}>
     */
    public function forMonth(Context $context, Carbon $month): array
    {
        $monthStart = $month->copy()->startOfMonth();

        $effective = $this->effectiveBudgets($context, $monthStart);
        $spentByCategory = $this->spentByCategory($context, $monthStart);
        $pendingByCategory = $this->projection->pendingByCategory($context, $monthStart);
        $childrenByParent = $context->categories()->whereNotNull('parent_id')->get()->groupBy('parent_id');

        $tree = function (array $byCategory, int $categoryId) use ($childrenByParent): float {
            $total = (float) ($byCategory[$categoryId] ?? 0);
            foreach ($childrenByParent[$categoryId] ?? [] as $child) {
                $total += (float) ($byCategory[$child->id] ?? 0);
            }

            return $total;
        };

        $rows = [];

        foreach ($effective as $categoryId => $budget) {
            $effectiveSpent = $tree($spentByCategory->all(), $categoryId);
            $spent = round($effectiveSpent + $tree($pendingByCategory, $categoryId), 2);
            $limit = (float) $budget->limit_amount;

            $rows[] = [
                'budget_id' => $budget->id,
                'category_id' => $categoryId,
                'category_name' => $budget->category->name,
                'is_override' => ! $budget->isDefault(),
                'limit' => $limit,
                'spent' => $spent,
                'spent_effective' => round($effectiveSpent, 2),
                'remaining' => round($limit - $spent, 2),
                'percent' => $limit > 0.0 ? min(999.9, round($spent / $limit * 100, 1)) : 0.0,
                'over' => $spent > $limit,
            ];
        }

        return $rows;
    }

    /**
     * Teto efetivo por categoria: override do mês ganha do padrão.
     *
     * @return array<int, Budget>
     */
    private function effectiveBudgets(Context $context, Carbon $monthStart): array
    {
        $budgets = $context->budgets()
            ->where(fn ($query) => $query->whereNull('month')->orWhereDate('month', $monthStart->toDateString()))
            ->with('category')
            ->get();

        $effective = [];

        foreach ($budgets as $budget) {
            if (! isset($effective[$budget->category_id]) || ! $budget->isDefault()) {
                $effective[$budget->category_id] = $budget;
            }
        }

        return $effective;
    }

    /**
     * Soma de despesa por `category_id` no mês.
     *
     * @return Collection<int, float>
     */
    private function spentByCategory(Context $context, Carbon $monthStart)
    {
        return $context->statementEntries()
            ->where('type', StatementEntryType::Expense->value)
            ->whereNotNull('category_id')
            ->whereYear('occurred_at', $monthStart->year)
            ->whereMonth('occurred_at', $monthStart->month)
            ->selectRaw('category_id, SUM(amount) as total')
            ->groupBy('category_id')
            ->pluck('total', 'category_id');
    }
}
