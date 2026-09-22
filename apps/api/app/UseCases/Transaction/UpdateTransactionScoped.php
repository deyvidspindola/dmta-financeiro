<?php

declare(strict_types=1);

namespace App\UseCases\Transaction;

use App\DTOs\UpdateRecurringTransactionSeriesData;
use App\DTOs\UpdateTransactionData;
use App\Enums\RecurrenceEditScope;
use App\Models\StatementEntry;

/**
 * Ponto de entrada único de "editar um lançamento" pro controller — só
 * decide entre editar a ocorrência avulsa ({@see UpdateTransaction}) ou
 * propagar pra série ({@see UpdateRecurringTransactionSeries}) conforme
 * {@see RecurrenceEditScope}. `future`/`all` sem `recurring_transaction_id`
 * cai pro caminho avulso — não é erro, só não tem série pra propagar.
 *
 * @package App\UseCases\Transaction
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   22/09/2026
 */
final class UpdateTransactionScoped
{
    public function __construct(
        private readonly UpdateTransaction $updateTransaction,
        private readonly UpdateRecurringTransactionSeries $updateSeries,
    ) {}

    public function execute(StatementEntry $entry, UpdateTransactionData $data, RecurrenceEditScope $scope): StatementEntry
    {
        if ($scope === RecurrenceEditScope::This || $entry->recurring_transaction_id === null) {
            return $this->updateTransaction->execute($entry, $data);
        }

        $this->updateSeries->execute($entry, new UpdateRecurringTransactionSeriesData(
            accountId: $data->accountId,
            description: $data->description,
            amount: $data->amount,
            type: $data->type,
            categoryId: $data->categoryId,
            goalId: $data->goalId,
            notes: $data->notes,
        ), $scope);

        return $entry->fresh();
    }
}
