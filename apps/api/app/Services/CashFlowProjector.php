<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Context;
use Illuminate\Support\Carbon;

/**
 * Fluxo de caixa futuro (capítulo 9.3, D-04): entradas e saídas já
 * cadastradas (boletos, faturas, regras recorrentes), cruzadas com o
 * saldo atual das contas — "vou ter saldo suficiente daqui a X dias?".
 * A soma de entrada/saída na janela vem de {@see MonthlyFlowProjector},
 * compartilhada com o orçamento livre.
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 2.0.0
 *
 * @since   25/08/2026
 *
 * @updated 02/09/2026
 */
final class CashFlowProjector
{
    /** Horizontes fixos da tela (capítulo 9.3) — o valor de mostrar os três juntos é comparar. */
    private const HORIZON_DAYS = [7, 30, 90];

    public function __construct(private readonly MonthlyFlowProjector $flow) {}

    /** @return list<array{days: int, income: float, expense: float, projected_balance: float}> */
    public function project(Context $context): array
    {
        $today = Carbon::today();
        $currentBalance = (float) $context->accounts()->sum('balance');

        return array_map(function (int $days) use ($context, $today, $currentBalance): array {
            $flow = $this->flow->between($context, $today, $today->copy()->addDays($days));

            return [
                'days' => $days,
                'income' => round($flow['income'], 2),
                'expense' => round($flow['expense'], 2),
                'projected_balance' => round($currentBalance + $flow['income'] - $flow['expense'], 2),
            ];
        }, self::HORIZON_DAYS);
    }
}
