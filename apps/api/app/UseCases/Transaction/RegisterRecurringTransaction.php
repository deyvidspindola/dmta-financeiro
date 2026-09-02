<?php

declare(strict_types=1);

namespace App\UseCases\Transaction;

use App\DTOs\RegisterRecurringTransactionData;
use App\Models\RecurringTransaction;
use App\Models\StatementEntry;
use App\Services\RecurringTransactionMaterializer;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Cadastra uma regra de lançamento recorrente (receita ou despesa fixa) e
 * já materializa, na mesma transação, toda ocorrência cuja data não é
 * futura — incluindo a do mês corrente quando `start_date` é hoje ou
 * antes. Sem isso a regra recém-criada só viraria {@see StatementEntry}
 * no dia seguinte, depois do job `GenerateRecurringTransactionEntries`,
 * e não apareceria nos lançamentos nem consumiria orçamento na hora.
 *
 * Ocorrências futuras continuam com o job diário. A materialização é
 * idempotente ({@see RecurringTransactionMaterializer}), então job e
 * cadastro nunca duplicam a mesma ocorrência.
 *
 * @package App\UseCases\Transaction
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 2.0.0
 *
 * @since   21/08/2026
 *
 * @updated 01/09/2026
 */
final class RegisterRecurringTransaction
{
    public function __construct(private readonly RecurringTransactionMaterializer $materializer) {}

    public function execute(RegisterRecurringTransactionData $data): RecurringTransaction
    {
        return DB::transaction(function () use ($data): RecurringTransaction {
            $rule = RecurringTransaction::create([
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

            $this->materializer->materializeDue($rule, Carbon::today());

            return $rule->refresh();
        });
    }
}
