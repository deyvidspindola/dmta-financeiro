<?php

declare(strict_types=1);

namespace App\UseCases\Notification;

use App\DTOs\RegisterTransactionData;
use App\Enums\NotificationCaptureStatus;
use App\Exceptions\Domain\CaptureAlreadyProcessedException;
use App\Exceptions\Domain\DuplicateTransactionException;
use App\Models\PendingNotificationCapture;
use App\Models\StatementEntry;
use App\UseCases\Transaction\RegisterTransaction;
use Illuminate\Support\Facades\DB;

/**
 * Promove uma notificação capturada a lançamento de verdade — o momento
 * em que "o banco me avisou de um gasto" vira "esse gasto está no meu
 * controle". Reusa {@see RegisterTransaction}; só acrescenta o vínculo
 * com a captura de origem e a trava anti-duplicidade pedida pelo dono.
 *
 * @package App\UseCases\Notification
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   03/09/2026
 *
 * @updated 03/09/2026
 */
final class SaveNotificationCaptureAsTransaction
{
    public function __construct(private readonly RegisterTransaction $registerTransaction) {}

    /**
     * @param  bool  $force  Ignora a trava anti-duplicidade (usuário confirmou que não é repetido).
     *
     * @throws CaptureAlreadyProcessedException Se a captura já não estiver `pending`.
     * @throws DuplicateTransactionException Se já existe um lançamento igual e `force` é `false`.
     */
    public function execute(PendingNotificationCapture $capture, RegisterTransactionData $data, bool $force = false): StatementEntry
    {
        $this->assertPending($capture);

        if (! $force && $this->looksDuplicated($data)) {
            throw new DuplicateTransactionException;
        }

        return DB::transaction(function () use ($capture, $data): StatementEntry {
            $entry = $this->registerTransaction->execute($data);

            $capture->forceFill([
                'status' => NotificationCaptureStatus::Saved->value,
                'statement_entry_id' => $entry->id,
            ])->save();

            return $entry;
        });
    }

    /** @throws CaptureAlreadyProcessedException */
    private function assertPending(PendingNotificationCapture $capture): void
    {
        // @phpstan-ignore-next-line notIdentical.alwaysTrue (larastan erra a inferência de casts(), ver StatementEntry.php)
        if ($capture->status !== NotificationCaptureStatus::Pending) {
            throw new CaptureAlreadyProcessedException;
        }
    }

    /** Mesma conta, tipo, valor e data de um lançamento que já existe. */
    private function looksDuplicated(RegisterTransactionData $data): bool
    {
        return StatementEntry::query()
            ->where('account_id', $data->accountId)
            ->where('type', $data->type->value)
            ->where('amount', $data->amount)
            ->whereDate('occurred_at', $data->occurredAt)
            ->exists();
    }
}
