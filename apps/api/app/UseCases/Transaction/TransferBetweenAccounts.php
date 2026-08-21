<?php

declare(strict_types=1);

namespace App\UseCases\Transaction;

use App\DTOs\TransferBetweenAccountsData;
use App\Enums\CaptureOrigin;
use App\Enums\StatementEntryType;
use App\Exceptions\Domain\AccountContextMismatchException;
use App\Exceptions\Domain\SameAccountTransferException;
use App\Models\Account;
use App\Models\StatementEntry;
use Illuminate\Support\Facades\DB;

/**
 * Transfere valor entre duas contas do mesmo contexto — gera duas
 * {@see StatementEntry} do tipo `transfer` ligadas por `transfer_pair_id`
 * (débito na origem, crédito no destino), cada uma movendo o saldo da
 * sua própria conta. Nunca usa categoria (transferência não é
 * receita/despesa) e nunca atravessa contexto — pra isso existe o fluxo
 * de mover cadastro ({@see MoveTransactionToContext}), que é outra coisa.
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
final class TransferBetweenAccounts
{
    /**
     * @return array{from: StatementEntry, to: StatementEntry}
     *
     * @throws SameAccountTransferException Se origem e destino forem a mesma conta.
     * @throws AccountContextMismatchException Se alguma conta não for do contexto informado.
     */
    public function execute(TransferBetweenAccountsData $data): array
    {
        if ($data->fromAccountId === $data->toAccountId) {
            throw new SameAccountTransferException;
        }

        return DB::transaction(function () use ($data): array {
            /** @var Account $from */
            $from = Account::query()->whereKey($data->fromAccountId)->lockForUpdate()->firstOrFail();
            /** @var Account $to */
            $to = Account::query()->whereKey($data->toAccountId)->lockForUpdate()->firstOrFail();

            if ($from->context_id !== $data->contextId || $to->context_id !== $data->contextId) {
                throw new AccountContextMismatchException;
            }

            $fromEntry = StatementEntry::create([
                'context_id' => $data->contextId,
                'account_id' => $from->id,
                'description' => $data->description,
                'amount' => $data->amount,
                'type' => StatementEntryType::Transfer->value,
                'occurred_at' => $data->occurredAt,
                'origin' => CaptureOrigin::Manual->value,
            ]);

            $toEntry = StatementEntry::create([
                'context_id' => $data->contextId,
                'account_id' => $to->id,
                'description' => $data->description,
                'amount' => $data->amount,
                'type' => StatementEntryType::Transfer->value,
                'occurred_at' => $data->occurredAt,
                'origin' => CaptureOrigin::Manual->value,
                'transfer_pair_id' => $fromEntry->id,
            ]);

            $fromEntry->update(['transfer_pair_id' => $toEntry->id]);

            $from->decrement('balance', $data->amount);
            $to->increment('balance', $data->amount);

            return ['from' => $fromEntry->fresh(), 'to' => $toEntry->fresh()];
        });
    }
}
