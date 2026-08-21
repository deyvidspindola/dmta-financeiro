<?php

declare(strict_types=1);

namespace App\UseCases\Investment;

use App\DTOs\RegisterInvestmentData;
use App\Models\Investment;

/**
 * Cadastra uma posição de investimento manual (D-14 — sem rentabilidade
 * automática). Aportes futuros são um caso de uso à parte, ainda não
 * existente na F0 (ver `PROGRESSO.md`).
 *
 * @package App\UseCases\Investment
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final class RegisterInvestment
{
    public function execute(RegisterInvestmentData $data): Investment
    {
        return Investment::create([
            'context_id' => $data->contextId,
            'name' => $data->name,
            'type' => $data->type,
            'broker' => $data->broker,
            'initial_amount' => $data->initialAmount,
            'current_amount' => $data->currentAmount,
            'acquired_at' => $data->acquiredAt,
        ]);
    }
}
