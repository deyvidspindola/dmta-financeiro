<?php

declare(strict_types=1);

namespace App\UseCases\Capture;

use App\Domain\Capture\QuickEntryChannelInterface;
use App\DTOs\RegisterTransactionData;
use App\DTOs\TransactionDraftData;
use App\Enums\CaptureOrigin;
use App\Models\TelegramConversation;
use App\Services\TelegramBotClient;
use App\UseCases\Transaction\RegisterTransaction;
use Illuminate\Support\Facades\Log;

/**
 * Ponto de entrada de uma mensagem do bot do Telegram (capítulo 6.4) —
 * delega a interpretação pra {@see QuickEntryChannelInterface}, e decide
 * o que fazer com o resultado: perguntar o que falta, registrar o
 * lançamento (mesmo {@see RegisterTransaction} de qualquer canal,
 * `origin: telegram`), ou responder ajuda. Chamado pelo Controller fino
 * do webhook — nunca lê o payload cru do Telegram, só `chatId`/`message`
 * já extraídos.
 *
 * @package App\UseCases\Capture
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   25/08/2026
 *
 * @updated 25/08/2026
 */
final class HandleTelegramMessage
{
    public function __construct(
        private readonly QuickEntryChannelInterface $channel,
        private readonly TelegramBotClient $bot,
        private readonly RegisterTransaction $registerTransaction,
    ) {}

    public function execute(string $chatId, string $message): void
    {
        $allowed = config('services.telegram.allowed_chat_id');

        if (! $allowed || (string) $allowed !== $chatId) {
            Log::warning('telegram: chat não autorizado — mensagem ignorada.', [
                'channel' => 'telegram',
                'received_chat_id' => $chatId,
                'allowed_chat_id' => $allowed ? (string) $allowed : null,
            ]);

            return;
        }

        $draft = $this->channel->parseMessage($chatId, $message);

        if ($draft === null) {
            $this->bot->sendMessage($chatId, $this->helpText());

            return;
        }

        if (! $draft->isComplete()) {
            $this->bot->sendMessage($chatId, $this->nextQuestion($chatId, $draft));

            return;
        }

        $this->registerTransaction->execute(new RegisterTransactionData(
            contextId: (int) $draft->contextId,
            accountId: (int) $draft->accountId,
            description: $draft->description,
            amount: (float) $draft->amount,
            type: $draft->type,
            occurredAt: now()->toDateString(),
            categoryId: $draft->categoryId,
            origin: CaptureOrigin::Telegram,
        ));

        $this->bot->sendMessage($chatId, "✅ Lançamento registrado: {$draft->description} — R$ {$draft->amount}");
    }

    private function helpText(): string
    {
        return 'Manda o valor e uma descrição (ex.: "gastei 45 no mercado" ou "recebi 200 de freela") pra lançar rápido.';
    }

    private function nextQuestion(string $chatId, TransactionDraftData $draft): string
    {
        if ($draft->contextId === null) {
            return 'Em qual contexto? Responda com o nome (ex.: "Pessoal").';
        }

        if ($draft->accountId === null) {
            TelegramConversation::query()->where('chat_id', $chatId)->delete();

            return 'Esse contexto não tem conta cadastrada — cadastre uma no app antes de lançar por aqui.';
        }

        return 'Qual categoria? Responda com o nome (ex.: "Mercado").';
    }
}
