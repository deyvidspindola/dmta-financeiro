<?php

declare(strict_types=1);

namespace App\UseCases\Transaction;

use App\DTOs\RegisterRecurringTransactionData;
use App\Models\RecurringTransaction;
use App\Models\StatementEntry;

/**
 * Cadastra uma regra de lançamento recorrente (receita ou despesa fixa).
 * Não cria nenhum {@see StatementEntry} nem move saldo —
 * quem materializa as ocorrências é o job diário
 * `GenerateRecurringTransactionEntries` (reusa {@see RegisterTransaction}),
 * inclusive a primeira, mesmo que `start_date` seja hoje.
 *
 * @package App\UseCases\Transaction
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final class RegisterRecurringTransaction
{
    public function execute(RegisterRecurringTransactionData $data): RecurringTransaction
    {
        return RecurringTransaction::create([
            'context_id' => $data->contextId,
            'account_id' => $data->accountId,
            'category_id' => $data->categoryId,
            'description' => $data->description,
            'amount' => $data->amount,
            'type' => $data->type->value,
            'interval' => $data->interval->value,
            'start_date' => $data->startDate,
            'end_date' => $data->endDate,
            'next_occurrence_date' => $data->startDate,
            'active' => true,
        ]);
    }
}
