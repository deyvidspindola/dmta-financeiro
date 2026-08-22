<?php

declare(strict_types=1);

namespace App\UseCases\Debt;

use App\DTOs\RegisterDebtData;
use App\Enums\DebtStatus;
use App\Models\Debt;
use App\Models\StatementEntry;

/**
 * Registra uma dívida pendente — nunca cria {@see StatementEntry}
 * nem move saldo de conta (ver docblock de {@see Debt}). É puro registro
 * de ciência de compromisso.
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
final class RegisterDebt
{
    public function execute(RegisterDebtData $data): Debt
    {
        return Debt::create([
            'context_id' => $data->contextId,
            'description' => $data->description,
            'counterparty' => $data->counterparty,
            'amount' => $data->amount,
            'direction' => $data->direction->value,
            'status' => DebtStatus::Pending->value,
            'due_date' => $data->dueDate,
            'notes' => $data->notes,
        ]);
    }
}
