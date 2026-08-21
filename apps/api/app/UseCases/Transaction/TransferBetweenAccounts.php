<?php

declare(strict_types=1);

namespace App\UseCases\Transaction;

use App\DTOs\TransferBetweenAccountsData;
use App\Enums\CaptureOrigin;
use App\Enums\StatementEntryType;
use App\Exceptions\Domain\AccountContextMismatchException;
use App\Exceptions\Domain\SameAccountTransferException;
use App\Http\Controllers\Api\V1\TransferController;
use App\Models\Account;
use App\Models\StatementEntry;
use Illuminate\Support\Facades\DB;

/**
 * Transfere valor entre duas contas — do mesmo contexto ou de contextos
 * diferentes (PF ⇄ empresa, ou entre duas empresas). Gera duas
 * {@see StatementEntry} do tipo `transfer` ligadas por `transfer_pair_id`
 * (débito na origem, crédito no destino), cada uma no `context_id` da sua
 * própria conta e movendo o saldo dela. Nunca usa categoria (transferência
 * não é receita/despesa).
 *
 * Quem autoriza que os dois contextos pertencem ao mesmo usuário é quem
 * chama este caso de uso ({@see TransferController}),
 * resolvendo `to_context_id` via `$user->contexts()` — aqui só confere
 * que cada conta bate com o contexto que foi passado pro seu lado.
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
     * @throws AccountContextMismatchException Se alguma conta não pertence ao contexto informado pro seu lado.
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

            if ($from->context_id !== $data->fromContextId || $to->context_id !== $data->toContextId) {
                throw new AccountContextMismatchException;
            }

            $fromEntry = StatementEntry::create([
                'context_id' => $from->context_id,
                'account_id' => $from->id,
                'description' => $data->description,
                'amount' => $data->amount,
                'type' => StatementEntryType::Transfer->value,
                'occurred_at' => $data->occurredAt,
                'origin' => CaptureOrigin::Manual->value,
            ]);

            $toEntry = StatementEntry::create([
                'context_id' => $to->context_id,
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
