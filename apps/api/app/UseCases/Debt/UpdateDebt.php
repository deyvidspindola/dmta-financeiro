<?php

declare(strict_types=1);

namespace App\UseCases\Debt;

use App\DTOs\UpdateDebtData;
use App\Models\Debt;

/**
 * Atualiza os dados de uma dívida já registrada. Não mexe em
 * `status`/`settled_at` — isso é responsabilidade de
 * {@see SettleDebt}, ação distinta e explícita.
 *
 * @package App\UseCases\Debt
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   22/08/2026
 *
 * @updated 22/08/2026
 */
final class UpdateDebt
{
    public function execute(Debt $debt, UpdateDebtData $data): Debt
    {
        $debt->update([
            'description' => $data->description,
            'counterparty' => $data->counterparty,
            'amount' => $data->amount,
            'due_date' => $data->dueDate,
            'notes' => $data->notes,
        ]);

        return $debt->refresh();
    }
}
