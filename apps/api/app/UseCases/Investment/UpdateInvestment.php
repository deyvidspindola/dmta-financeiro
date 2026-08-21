<?php

declare(strict_types=1);

namespace App\UseCases\Investment;

use App\DTOs\UpdateInvestmentData;
use App\Models\Investment;

/**
 * Atualiza o cadastro de um investimento — inclusive `current_amount`
 * como correção manual de posição, fora do fluxo de aporte
 * (D-14, sem rentabilidade automática).
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
final class UpdateInvestment
{
    public function execute(Investment $investment, UpdateInvestmentData $data): Investment
    {
        $investment->update([
            'name' => $data->name,
            'type' => $data->type,
            'broker' => $data->broker,
            'current_amount' => $data->currentAmount,
        ]);

        return $investment;
    }
}
