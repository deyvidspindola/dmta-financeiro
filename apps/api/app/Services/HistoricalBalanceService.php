<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\StatementEntryType;
use App\Enums\TransferRole;
use App\Models\Context;
use App\Models\StatementEntry;
use App\UseCases\Transaction\TransferBetweenAccounts;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Saldo das contas de um contexto **como estava numa data passada** —
 * replay do histórico, não uma coluna guardada. Usado pelo dashboard
 * quando o passador de mês está num mês já fechado: o usuário quer ver
 * "como o mês fechou", não o saldo de hoje.
 *
 * Só conta lançamentos efetivados (`settled`) — os `pending` nunca
 * mexeram no saldo. Transferência: a perna de origem sai, a de destino
 * entra (mesmo padrão de {@see TransferBetweenAccounts}).
 *
 * NÃO cobre saldo futuro/provisionado (isso é `accounts_balance_provisioned`
 * no {@see DashboardSummaryService}).
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   02/09/2026
 *
 * @updated 15/09/2026
 */
final class HistoricalBalanceService
{
    /** Soma dos saldos das contas do contexto ao fim do dia `$date`. */
    public function asOf(Context $context, Carbon $date, bool $includeInDashboardOnly = false): float
    {
        $query = $context->accounts();
        if ($includeInDashboardOnly) {
            $query->where('include_in_dashboard', true);
        }

        $initial = (float) $query->sum('initial_balance');
        $delta = $this->deltaQuery($context, $date, $includeInDashboardOnly)->value('delta');

        return round($initial + (float) $delta, 2);
    }

    /**
     * Mesmo replay de {@see self::asOf()}, mas por conta — usado pela
     * listagem de Contas quando o passador de mês está num mês fechado.
     * Contas sem nenhum lançamento até `$date` não aparecem no `GROUP BY`
     * do delta; entram no resultado com o próprio `initial_balance`.
     *
     * @return array<int, float> `account_id` => saldo.
     */
    public function perAccountAsOf(Context $context, Carbon $date, bool $includeInDashboardOnly = false): array
    {
        $query = $context->accounts();
        if ($includeInDashboardOnly) {
            $query->where('include_in_dashboard', true);
        }

        $balances = $query->pluck('initial_balance', 'id')
            ->map(fn ($value) => (float) $value)
            ->all();

        $deltas = $this->deltaQuery($context, $date, $includeInDashboardOnly)
            ->selectRaw('account_id')
            ->groupBy('account_id')
            ->pluck('delta', 'account_id');

        foreach ($deltas as $accountId => $delta) {
            $balances[$accountId] = round(($balances[$accountId] ?? 0.0) + (float) $delta, 2);
        }

        return $balances;
    }

    /**
     * Query base do delta (CASE de sinal por tipo) usada por `asOf`/`perAccountAsOf`.
     *
     * @return HasMany<StatementEntry, Context>
     */
    private function deltaQuery(Context $context, Carbon $date, bool $includeInDashboardOnly = false): HasMany
    {
        $query = $context->statementEntries()
            ->settled()
            ->whereDate('occurred_at', '<=', $date->toDateString());

        if ($includeInDashboardOnly) {
            $query->whereIn('account_id', $context->accounts()->where('include_in_dashboard', true)->pluck('id'));
        }

        return $query->selectRaw(
            'SUM(CASE '
            .'WHEN type = ? THEN -amount '
            .'WHEN type = ? AND transfer_role = ? THEN -amount '
            .'ELSE amount END) as delta',
            [
                StatementEntryType::Expense->value,
                StatementEntryType::Transfer->value,
                TransferRole::Origin->value,
            ],
        );
    }
}
