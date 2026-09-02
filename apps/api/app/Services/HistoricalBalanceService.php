<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\StatementEntryType;
use App\Enums\TransferRole;
use App\Models\Context;
use App\UseCases\Transaction\TransferBetweenAccounts;
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
 * no {@see DashboardSummaryService}) nem saldo por conta individual.
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   02/09/2026
 */
final class HistoricalBalanceService
{
    /** Soma dos saldos das contas do contexto ao fim do dia `$date`. */
    public function asOf(Context $context, Carbon $date): float
    {
        $initial = (float) $context->accounts()->sum('initial_balance');

        $delta = $context->statementEntries()
            ->settled()
            ->whereDate('occurred_at', '<=', $date->toDateString())
            ->selectRaw(
                'SUM(CASE '
                .'WHEN type = ? THEN -amount '
                .'WHEN type = ? AND transfer_role = ? THEN -amount '
                .'ELSE amount END) as delta',
                [
                    StatementEntryType::Expense->value,
                    StatementEntryType::Transfer->value,
                    TransferRole::Origin->value,
                ],
            )
            ->value('delta');

        return round($initial + (float) $delta, 2);
    }
}
