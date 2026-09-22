<?php

declare(strict_types=1);

namespace App\UseCases\Transaction;

use App\Enums\RecurrenceEditScope;
use App\Models\StatementEntry;

/**
 * Ponto de entrada único de "apagar um lançamento" pro controller — só
 * decide entre apagar a ocorrência avulsa ({@see DeleteTransaction}) ou
 * a série ({@see DeleteRecurringTransactionSeries}) conforme
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
final class DeleteTransactionScoped
{
    public function __construct(
        private readonly DeleteTransaction $deleteTransaction,
        private readonly DeleteRecurringTransactionSeries $deleteSeries,
    ) {}

    public function execute(StatementEntry $entry, RecurrenceEditScope $scope): void
    {
        if ($scope === RecurrenceEditScope::This || $entry->recurring_transaction_id === null) {
            $this->deleteTransaction->execute($entry);

            return;
        }

        $this->deleteSeries->execute($entry, $scope);
    }
}
