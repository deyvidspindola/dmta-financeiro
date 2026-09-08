<?php

declare(strict_types=1);

namespace App\UseCases\Capture;

use App\Domain\Capture\QuickEntryChannelInterface;
use App\Domain\Capture\TelegramQuickEntryChannel;
use App\Enums\CaptureOrigin;
use App\Models\StatementEntry;
use App\Models\TelegramConversation;
use App\UseCases\Transaction\DeleteTransaction;

/**
 * "desfazer" no bot do Telegram: apaga o lançamento que a última conversa
 * registrou (id guardado em `TelegramConversation.draft._txn` por
 * {@see TelegramQuickEntryChannel::markRegistered()}).
 * Só apaga lançamento de origem `telegram` — nunca um manual/importado.
 *
 * @package App\UseCases\Capture
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   07/09/2026
 *
 * @updated 07/09/2026
 */
final class UndoLastTelegramEntry
{
    public function __construct(
        private readonly DeleteTransaction $deleteTransaction,
        private readonly QuickEntryChannelInterface $channel,
    ) {}

    /** @return bool `true` se havia algo pra desfazer e foi apagado. */
    public function execute(string $chatId): bool
    {
        $conversation = TelegramConversation::query()->where('chat_id', $chatId)->first();
        /** @var array<string, mixed> $draft */
        $draft = $conversation !== null ? $conversation->draft : [];
        $txnId = $draft['_txn'] ?? null;

        $entry = $txnId !== null ? StatementEntry::query()->find($txnId) : null;

        // `origin` não tem cast no model — comparar com a string.
        if ($entry === null || $entry->origin !== CaptureOrigin::Telegram->value) {
            return false;
        }

        $this->deleteTransaction->execute($entry);
        $this->channel->cancel($chatId);

        return true;
    }
}
