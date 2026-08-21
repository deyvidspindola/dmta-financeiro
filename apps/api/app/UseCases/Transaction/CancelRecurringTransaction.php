<?php

declare(strict_types=1);

namespace App\UseCases\Transaction;

use App\Models\RecurringTransaction;

/**
 * Cancela uma regra de recorrência — não apaga nem desfaz as ocorrências
 * já geradas (cada `StatementEntry` gerado é um lançamento normal, some
 * junto com ele só se apagado individualmente); só impede que o job
 * gere ocorrências novas a partir de agora.
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
final class CancelRecurringTransaction
{
    public function execute(RecurringTransaction $recurringTransaction): void
    {
        $recurringTransaction->update(['active' => false]);
    }
}
