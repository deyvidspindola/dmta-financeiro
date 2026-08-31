<?php

declare(strict_types=1);

namespace App\UseCases\Debt;

use App\DTOs\RegisterTransactionData;
use App\DTOs\SettleDebtData;
use App\Enums\DebtDirection;
use App\Enums\DebtStatus;
use App\Enums\StatementEntryType;
use App\Models\Debt;
use App\Models\StatementEntry;
use App\UseCases\Transaction\RegisterTransaction;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Marca uma dívida como quitada. Por padrão só atualiza o registro (D-15
 * — a dívida nunca entra sozinha no balanço). Se `accountId` vier no
 * {@see SettleDebtData}, a quitação também move saldo: cria um
 * {@see StatementEntry} na conta (despesa quando `i_owe`,
 * receita quando `owed_to_me`) via {@see RegisterTransaction} e guarda o
 * vínculo em `debts.statement_entry_id`.
 *
 * O que NÃO faz: não desfaz uma quitação (é `update`, não toggle); não
 * cria lançamento sem `accountId` explícito — as duas coisas continuam
 * não fundidas por padrão.
 *
 * @package App\UseCases\Debt
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 2.0.0
 *
 * @since   22/08/2026
 *
 * @updated 31/08/2026
 */
final class SettleDebt
{
    public function __construct(private readonly RegisterTransaction $registerTransaction) {}

    public function execute(Debt $debt, ?SettleDebtData $data = null): Debt
    {
        $data ??= new SettleDebtData;

        return DB::transaction(function () use ($debt, $data): Debt {
            $entryId = $data->accountId !== null
                ? $this->registerSettlementEntry($debt, $data)->id
                : null;

            $debt->update([
                'status' => DebtStatus::Settled->value,
                'settled_at' => now(),
                'statement_entry_id' => $entryId,
            ]);

            return $debt->refresh();
        });
    }

    /** Lançamento que move o dinheiro da quitação: despesa se eu devia, receita se me deviam. */
    private function registerSettlementEntry(Debt $debt, SettleDebtData $data): StatementEntry
    {
        $type = $debt->direction === DebtDirection::IOwe->value
            ? StatementEntryType::Expense
            : StatementEntryType::Income;

        return $this->registerTransaction->execute(new RegisterTransactionData(
            contextId: $debt->context_id,
            accountId: (int) $data->accountId,
            description: 'Quitação: '.$debt->description,
            amount: (float) $debt->amount,
            type: $type,
            occurredAt: $data->occurredAt ?? Carbon::today()->toDateString(),
        ));
    }
}
