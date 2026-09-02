<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\StatementEntryType;
use App\Models\Context;
use App\Models\StatementEntry;
use App\Models\User;
use Illuminate\Support\Carbon;

/**
 * Série de evolução mensal (receita / despesa / saldo do período) que
 * alimenta o gráfico de "saúde financeira ao longo do tempo" do
 * dashboard. Só lançamentos efetivados — não projeta nada.
 *
 * Separado de {@see DashboardSummaryService} (que soma os indicadores do
 * mês): são duas leituras diferentes do mesmo dashboard.
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
final class DashboardEvolutionService
{
    /** Meses cobertos por padrão quando `months` não vem na query string. */
    private const DEFAULT_MONTHS = 6;

    /** Teto de meses aceito — evita varrer o histórico inteiro por engano. */
    private const MAX_MONTHS = 24;

    /**
     * @return list<array{month: string, income: float, expense: float, balance: float}>
     */
    public function forContext(Context $context, ?int $months = null): array
    {
        return $this->series([$context->id], $months);
    }

    /**
     * Mesma série, somando todos os contextos do usuário.
     *
     * @return list<array{month: string, income: float, expense: float, balance: float}>
     */
    public function forConsolidated(User $user, ?int $months = null): array
    {
        return $this->series($user->contexts()->pluck('id')->all(), $months);
    }

    /**
     * Agrega `statement_entries` por mês numa única query (evita 1
     * consulta por mês) e preenche os meses sem lançamento com zero — o
     * gráfico sempre recebe uma série contínua.
     *
     * @param  list<int>  $contextIds
     * @return list<array{month: string, income: float, expense: float, balance: float}>
     */
    private function series(array $contextIds, ?int $months): array
    {
        $months = max(1, min($months ?? self::DEFAULT_MONTHS, self::MAX_MONTHS));
        $start = Carbon::now()->startOfMonth()->subMonths($months - 1);

        $rowsByMonth = StatementEntry::query()
            ->whereIn('context_id', $contextIds)
            ->whereIn('type', [StatementEntryType::Income->value, StatementEntryType::Expense->value])
            ->where('occurred_at', '>=', $start->toDateString())
            ->selectRaw("DATE_FORMAT(occurred_at, '%Y-%m') as month")
            ->selectRaw("SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income")
            ->selectRaw("SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense")
            ->groupBy('month')
            ->get()
            ->keyBy('month');

        $series = [];

        for ($i = 0; $i < $months; $i++) {
            $key = $start->copy()->addMonths($i)->format('Y-m');
            $row = $rowsByMonth->get($key);
            $income = (float) ($row->income ?? 0);
            $expense = (float) ($row->expense ?? 0);

            $series[] = [
                'month' => $key,
                'income' => $income,
                'expense' => $expense,
                'balance' => $income - $expense,
            ];
        }

        return $series;
    }
}
