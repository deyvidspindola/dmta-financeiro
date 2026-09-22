<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\BillStatus;
use App\Enums\CardInvoiceStatus;
use App\Enums\DebtDirection;
use App\Enums\DebtStatus;
use App\Enums\GoalStatus;
use App\Enums\StatementEntryType;
use App\Models\CardInvoice;
use App\Models\Context;
use App\Models\Debt;
use App\Models\User;
use Illuminate\Support\Carbon;

/**
 * Resumo de dashboard por contexto e consolidado entre todos os contextos
 * de um usuário. Reusado por `DashboardController::show` (um contexto) e
 * `::consolidated` (todos) — por isso é Service, não lógica solta em cada
 * ação (capítulo 04.3: soma para exibir, nunca mistura para movimentar).
 *
 * `month_income`/`month_expense` = efetivado no mês; `month_projected_*`
 * soma o que ainda vai cair (boleto, fatura, recorrência) via
 * {@see MonthlyFlowProjector}, sem duplicar (cursor da regra já avançou).
 * Dívida pendente é só indicador — nunca some com os dois (ver {@see Debt}).
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 2.3.0
 *
 * @since   21/08/2026
 *
 * @updated 22/09/2026
 */
final class DashboardSummaryService
{
    public function __construct(
        private readonly MonthlyFlowProjector $projector,
        private readonly HistoricalBalanceService $history,
        private readonly CrossContextTransferCorrectionService $transferCorrection,
    ) {}

    /**
     * `$month` (passador de mês do app) rege as métricas do mês; `null` =
     * mês corrente. Os outros indicadores são estado "agora".
     *
     * @return array<string, mixed>
     */
    public function forContext(Context $context, ?Carbon $month = null): array
    {
        $reference = $month ?? Carbon::now();
        $now = Carbon::now();
        $monthStart = $reference->copy()->startOfMonth();
        $monthEnd = $reference->copy()->endOfMonth();

        // "Em aberto" só o mês corrente — sem isso, a recorrência de 12
        // meses à frente inflava o card (pedido do dono, 22/09/2026).
        $pending = $context->bills()->where('status', BillStatus::Pending->value)
            ->whereBetween('due_date', [$monthStart->toDateString(), $monthEnd->toDateString()]);
        $overdue = $context->bills()->where('status', BillStatus::Pending->value)
            ->where('due_date', '<', $now->toDateString());

        $incomeEffective = (float) $this->monthEntries($context, StatementEntryType::Income, $reference);
        $expenseEffective = (float) $this->monthEntries($context, StatementEntryType::Expense, $reference);
        $pendingIncomeMonth = (float) $this->monthEntries($context, StatementEntryType::Income, $reference, settled: false);
        $pendingExpenseMonth = (float) $this->monthEntries($context, StatementEntryType::Expense, $reference, settled: false);
        $projected = $this->projector->between($context, $monthStart, $monthEnd);

        // Mês já fechado → saldo "como o mês fechou" (replay do histórico).
        // Mês corrente ou futuro → saldo real de agora.
        // Só contas com `include_in_dashboard` entram no cálculo.
        $isPastMonth = $monthEnd->lt($now->copy()->startOfMonth());
        $accountsBalance = $isPastMonth
            ? $this->history->asOf($context, $monthEnd, includeInDashboardOnly: true)
            : (float) $context->accounts()->where('include_in_dashboard', true)->sum('balance');

        return [
            'context_id' => $context->id,
            'month' => $reference->format('Y-m'),
            'accounts_balance' => $accountsBalance,
            // Provisionado: real + previsto (pending + boleto/recorrência do
            // mês, base de month_projected_*; sem isso boleto em aberto não
            // pesava aqui). Mês passado não tem previsto, mostra o real.
            'accounts_balance_provisioned' => $isPastMonth
                ? $accountsBalance
                : round($accountsBalance + $this->pendingBalanceDelta($context, includeInDashboardOnly: true)
                    + $projected['income'] - $projected['expense'], 2),
            'pending_bills_count' => $pending->count(),
            'pending_bills_amount' => (float) $pending->sum('amount'),
            'overdue_bills_count' => $overdue->count(),
            'overdue_bills_amount' => (float) $overdue->sum('amount'),
            'month_income' => $incomeEffective,
            'month_expense' => $expenseEffective,
            'month_projected_income' => round($incomeEffective + $pendingIncomeMonth + $projected['income'], 2),
            'month_projected_expense' => round($expenseEffective + $pendingExpenseMonth + $projected['expense'], 2),
            'investments_total' => (float) $context->investments()->sum('current_amount'),
            'credit_card_open_invoices_amount' => $this->openCardInvoicesAmount($context),
            'pending_debts_count' => $context->debts()->where('status', DebtStatus::Pending->value)->count(),
            'pending_debts_i_owe_amount' => (float) $context->debts()
                ->where('status', DebtStatus::Pending->value)
                ->where('direction', DebtDirection::IOwe->value)
                ->sum('amount'),
            'pending_debts_owed_to_me_amount' => (float) $context->debts()
                ->where('status', DebtStatus::Pending->value)
                ->where('direction', DebtDirection::OwedToMe->value)
                ->sum('amount'),
            'active_goals_count' => $context->goals()->where('status', GoalStatus::Active->value)->count(),
        ];
    }

    /** @param  bool  $settled  `true` = só efetivados (padrão); `false` = só previstos. */
    private function monthEntries(Context $context, StatementEntryType $type, Carbon $reference, bool $settled = true): float
    {
        return (float) $context->statementEntries()
            ->where('type', $type->value)
            ->when($settled, fn ($q) => $q->settled(), fn ($q) => $q->pending())
            ->whereYear('occurred_at', $reference->year)
            ->whereMonth('occurred_at', $reference->month)
            ->sum('amount');
    }

    /**
     * Impacto no saldo de todo lançamento previsto (pending) do contexto,
     * sinal: receita soma, despesa subtrai. Sem filtro de mês — despesa
     * prevista de mês passado ainda não paga continua pesando aqui.
     * `$includeInDashboardOnly` espelha o filtro do `accountsBalance` que
     * este delta soma em cima (senão vazava pending de conta excluída).
     */
    private function pendingBalanceDelta(Context $context, bool $includeInDashboardOnly = false): float
    {
        $accountIds = $includeInDashboardOnly
            ? $context->accounts()->where('include_in_dashboard', true)->pluck('id')
            : null;

        $income = (float) $context->statementEntries()->pending()
            ->where('type', StatementEntryType::Income->value)
            ->when($accountIds, fn ($q) => $q->whereIn('account_id', $accountIds))
            ->sum('amount');
        $expense = (float) $context->statementEntries()->pending()
            ->where('type', StatementEntryType::Expense->value)
            ->when($accountIds, fn ($q) => $q->whereIn('account_id', $accountIds))
            ->sum('amount');

        return $income - $expense;
    }

    /** Total das faturas de cartão ainda não pagas (aberta + fechadas) do contexto. */
    private function openCardInvoicesAmount(Context $context): float
    {
        return (float) CardInvoice::query()
            ->whereIn('credit_card_id', $context->creditCards()->select('id'))
            ->where('status', '!=', CardInvoiceStatus::Paid->value)
            ->sum('total_amount');
    }

    /**
     * Soma o resumo de todos os contextos do usuário — visão consolidada.
     * Nunca usada para decidir de onde um lançamento sai; só para exibir.
     * Receita/despesa descontam a transferência entre contextos do
     * próprio usuário (D-20, {@see CrossContextTransferCorrectionService}).
     *
     * @return array{contexts: list<array<string, mixed>>, totals: array<string, float|int>}
     */
    public function consolidated(User $user, ?Carbon $month = null): array
    {
        $perContext = $user->contexts()->get()->map(fn (Context $c) => $this->forContext($c, $month));

        $sum = fn (string $key): float => (float) $perContext->sum($key);
        $count = fn (string $key): int => (int) $perContext->sum($key);
        $correction = $this->transferCorrection->forMonth($user, $month ?? Carbon::now());

        $totals = [
            'accounts_balance' => $sum('accounts_balance'),
            'accounts_balance_provisioned' => $sum('accounts_balance_provisioned'),
            'pending_bills_count' => $count('pending_bills_count'),
            'pending_bills_amount' => $sum('pending_bills_amount'),
            'overdue_bills_count' => $count('overdue_bills_count'),
            'overdue_bills_amount' => $sum('overdue_bills_amount'),
            'month_income' => round($sum('month_income') - $correction['income'], 2),
            'month_expense' => round($sum('month_expense') - $correction['expense'], 2),
            'month_projected_income' => round($sum('month_projected_income') - $correction['income'], 2),
            'month_projected_expense' => round($sum('month_projected_expense') - $correction['expense'], 2),
            'investments_total' => $sum('investments_total'),
            'credit_card_open_invoices_amount' => $sum('credit_card_open_invoices_amount'),
            'pending_debts_count' => $count('pending_debts_count'),
            'pending_debts_i_owe_amount' => $sum('pending_debts_i_owe_amount'),
            'pending_debts_owed_to_me_amount' => $sum('pending_debts_owed_to_me_amount'),
            'active_goals_count' => $count('active_goals_count'),
        ];

        return ['contexts' => $perContext->values()->all(), 'totals' => $totals];
    }
}
