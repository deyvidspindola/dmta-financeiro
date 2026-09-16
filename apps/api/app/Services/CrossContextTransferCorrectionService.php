<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\StatementEntryType;
use App\Models\StatementEntry;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Soma das duas pernas de uma transferência entre contextos diferentes
 * do usuário (D-20) num mês — `transfer_pair_id` não nulo com `type`
 * receita/despesa (só existe nesse caso: transferência de mesmo contexto
 * continua `type = transfer`, nunca aparece aqui). Cada perna é
 * receita/despesa de verdade dentro do seu próprio contexto, mas não é
 * dinheiro novo pra soma consolidada — `DashboardSummaryService::consolidated`
 * e `DashboardEvolutionService::forConsolidated` usam isto pra tirar o
 * par da conta.
 *
 * Transferência nunca fica `pending`, então a mesma correção vale tanto
 * pro efetivo quanto pro projetado.
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   16/09/2026
 *
 * @updated 16/09/2026
 */
final class CrossContextTransferCorrectionService
{
    /** @return array{income: float, expense: float} */
    public function forMonth(User $user, Carbon $reference): array
    {
        $contextIds = $user->contexts()->pluck('id');

        return [
            'income' => $this->sum($contextIds, StatementEntryType::Income, $reference),
            'expense' => $this->sum($contextIds, StatementEntryType::Expense, $reference),
        ];
    }

    /** @param  Collection<int, int>  $contextIds */
    private function sum(Collection $contextIds, StatementEntryType $type, Carbon $reference): float
    {
        return (float) StatementEntry::query()
            ->whereIn('context_id', $contextIds)
            ->whereNotNull('transfer_pair_id')
            ->where('type', $type->value)
            ->settled()
            ->whereYear('occurred_at', $reference->year)
            ->whereMonth('occurred_at', $reference->month)
            ->sum('amount');
    }
}
