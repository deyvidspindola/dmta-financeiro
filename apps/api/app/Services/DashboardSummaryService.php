<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\BillStatus;
use App\Enums\StatementEntryType;
use App\Models\Context;
use App\Models\StatementEntry;
use App\Models\User;
use Illuminate\Support\Carbon;

/**
 * Resumo de dashboard por contexto e consolidado entre todos os contextos
 * de um usuário. Reusado por `DashboardController::show` (um contexto) e
 * `::consolidated` (todos) — por isso é Service, não lógica solta em cada
 * ação (capítulo 04.3: soma para exibir, nunca mistura para movimentar).
 *
 * Também monta a série de evolução mensal (receita/despesa/saldo) que
 * alimenta os gráficos e relatórios por período do dashboard — mesma
 * regra de "só exibir, nunca decidir saldo" das outras leituras daqui.
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   21/08/2026
 *
 * @updated 22/08/2026
 */
final class DashboardSummaryService
{
    /** Meses cobertos por padrão quando `months` não vem na query string. */
    private const DEFAULT_EVOLUTION_MONTHS = 6;

    /** Teto de meses aceito — evita varrer o histórico inteiro por engano. */
    private const MAX_EVOLUTION_MONTHS = 24;

    /** @return array<string, mixed> */
    public function forContext(Context $context): array
    {
        $now = Carbon::now();
        $pending = $context->bills()->where('status', BillStatus::Pending->value);
        $overdue = $context->bills()
            ->where('status', BillStatus::Pending->value)
            ->where('due_date', '<', $now->toDateString());

        return [
            'context_id' => $context->id,
            'accounts_balance' => (float) $context->accounts()->sum('balance'),
            'pending_bills_count' => $pending->count(),
            'pending_bills_amount' => (float) $context->bills()
                ->where('status', BillStatus::Pending->value)
                ->sum('amount'),
            'overdue_bills_count' => $overdue->count(),
            'overdue_bills_amount' => (float) $context->bills()
                ->where('status', BillStatus::Pending->value)
                ->where('due_date', '<', $now->toDateString())
                ->sum('amount'),
            'month_income' => (float) $context->statementEntries()
                ->where('type', StatementEntryType::Income->value)
                ->whereYear('occurred_at', $now->year)
                ->whereMonth('occurred_at', $now->month)
                ->sum('amount'),
            'month_expense' => (float) $context->statementEntries()
                ->where('type', StatementEntryType::Expense->value)
                ->whereYear('occurred_at', $now->year)
                ->whereMonth('occurred_at', $now->month)
                ->sum('amount'),
            'investments_total' => (float) $context->investments()->sum('current_amount'),
        ];
    }

    /**
     * Soma o resumo de todos os contextos do usuário — visão consolidada.
     * Nunca usada para decidir de onde um lançamento sai; só para exibir.
     *
     * @return array{contexts: list<array<string, mixed>>, totals: array<string, float|int>}
     */
    public function consolidated(User $user): array
    {
        $perContext = $user->contexts()->get()->map(fn (Context $context) => $this->forContext($context));

        $totals = [
            'accounts_balance' => (float) $perContext->sum('accounts_balance'),
            'pending_bills_count' => (int) $perContext->sum('pending_bills_count'),
            'pending_bills_amount' => (float) $perContext->sum('pending_bills_amount'),
            'overdue_bills_count' => (int) $perContext->sum('overdue_bills_count'),
            'overdue_bills_amount' => (float) $perContext->sum('overdue_bills_amount'),
            'month_income' => (float) $perContext->sum('month_income'),
            'month_expense' => (float) $perContext->sum('month_expense'),
            'investments_total' => (float) $perContext->sum('investments_total'),
        ];

        return ['contexts' => $perContext->values()->all(), 'totals' => $totals];
    }

    /**
     * Evolução mensal (receita, despesa, saldo do período) de um único
     * contexto — base do gráfico de "saúde financeira ao longo do tempo".
     *
     * @return list<array{month: string, income: float, expense: float, balance: float}>
     */
    public function evolutionForContext(Context $context, ?int $months = null): array
    {
        return $this->evolution([$context->id], $months);
    }

    /**
     * Mesma série, somando todos os contextos do usuário — versão
     * consolidada do gráfico de evolução.
     *
     * @return list<array{month: string, income: float, expense: float, balance: float}>
     */
    public function evolutionConsolidated(User $user, ?int $months = null): array
    {
        return $this->evolution($user->contexts()->pluck('id')->all(), $months);
    }

    /**
     * Agrega `statement_entries` por mês numa única query (evita 1
     * consulta por mês do período) e preenche os meses sem lançamento
     * com zero — o gráfico sempre recebe uma série contínua.
     *
     * @param  list<int>  $contextIds
     * @return list<array{month: string, income: float, expense: float, balance: float}>
     */
    private function evolution(array $contextIds, ?int $months): array
    {
        $months = max(1, min($months ?? self::DEFAULT_EVOLUTION_MONTHS, self::MAX_EVOLUTION_MONTHS));
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
