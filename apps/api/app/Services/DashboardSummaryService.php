<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\BillStatus;
use App\Enums\StatementEntryType;
use App\Models\Context;
use App\Models\User;
use Illuminate\Support\Carbon;

/**
 * Resumo de dashboard por contexto e consolidado entre todos os contextos
 * de um usuário. Reusado por `DashboardController::show` (um contexto) e
 * `::consolidated` (todos) — por isso é Service, não lógica solta em cada
 * ação (capítulo 04.3: soma para exibir, nunca mistura para movimentar).
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final class DashboardSummaryService
{
    /** @return array<string, mixed> */
    public function forContext(Context $context): array
    {
        $now = Carbon::now();

        return [
            'context_id' => $context->id,
            'accounts_balance' => (float) $context->accounts()->sum('balance'),
            'pending_bills_amount' => (float) $context->bills()
                ->where('status', BillStatus::Pending->value)
                ->sum('amount'),
            'overdue_bills_count' => $context->bills()
                ->where('status', BillStatus::Pending->value)
                ->where('due_date', '<', $now->toDateString())
                ->count(),
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
            'pending_bills_amount' => (float) $perContext->sum('pending_bills_amount'),
            'overdue_bills_count' => (int) $perContext->sum('overdue_bills_count'),
            'month_income' => (float) $perContext->sum('month_income'),
            'month_expense' => (float) $perContext->sum('month_expense'),
            'investments_total' => (float) $perContext->sum('investments_total'),
        ];

        return ['contexts' => $perContext->values()->all(), 'totals' => $totals];
    }
}
