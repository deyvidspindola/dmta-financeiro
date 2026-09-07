<?php

declare(strict_types=1);

namespace App\UseCases\Capture;

use App\Domain\Capture\QuickEntryChannelInterface;
use App\DTOs\RegisterTransactionData;
use App\DTOs\TransactionDraftData;
use App\Enums\CaptureOrigin;
use App\Models\TelegramConversation;
use App\Models\User;
use App\Services\TelegramBotClient;
use App\Services\TelegramWebhookRecorder;
use App\UseCases\Transaction\RegisterTransaction;

/**
 * Uma mensagem recebida do bot do Telegram (capítulo 6.4). Sempre
 * responde alguma coisa pro chat (mesmo em erro de configuração — é a
 * única forma de o dono saber o que está errado) e grava o desfecho em
 * {@see TelegramWebhookRecorder} pra tela de integrações mostrar.
 *
 * @package App\UseCases\Capture
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 2.0.0
 *
 * @since   25/08/2026
 *
 * @updated 07/09/2026
 */
final class HandleTelegramMessage
{
    public function __construct(
        private readonly QuickEntryChannelInterface $channel,
        private readonly TelegramBotClient $bot,
        private readonly RegisterTransaction $registerTransaction,
        private readonly TelegramWebhookRecorder $recorder,
    ) {}

    public function execute(string $chatId, string $message): void
    {
        [$outcome, $detail, $reply] = $this->resolve($chatId, $message);

        $this->bot->sendMessage($chatId, $reply);
        $this->recorder->record($chatId, $message, $outcome, $detail, replySent: true);
    }

    /** @return array{0: string, 1: ?string, 2: string} outcome, detalhe, texto da resposta */
    private function resolve(string $chatId, string $message): array
    {
        $allowed = config('services.telegram.allowed_chat_id');

        if (! $allowed) {
            return ['not_configured', null, "Seu chat ID é {$chatId}. Cole ele em Integrações → Telegram → \"Chat ID autorizado\" pra ativar o bot."];
        }

        if ((string) $allowed !== $chatId) {
            return ['chat_not_authorized', "recebido {$chatId}, autorizado {$allowed}", "Este chat (ID {$chatId}) não é o autorizado. Ajuste em Integrações → Telegram."];
        }

        $email = config('services.telegram.user_email');

        if (blank($email) || ! User::query()->where('email', $email)->exists()) {
            return ['owner_not_found', $email ? "email: {$email}" : 'sem email', 'Configuração incompleta: em Integrações → Telegram, o campo "E-mail do dono" precisa ser o e-mail da SUA conta no app (o que você usa pra entrar). Está como '.($email ?: 'vazio').'.'];
        }

        $draft = $this->channel->parseMessage($chatId, $message);

        if ($draft === null) {
            return ['help_sent', null, $this->helpText()];
        }

        if (! $draft->isComplete()) {
            return ['awaiting_reply', null, $this->nextQuestion($chatId, $draft)];
        }

        $this->register($draft);

        return ['registered', "{$draft->description} — R$ {$draft->amount}", "✅ Lançamento registrado: {$draft->description} — R$ {$draft->amount}"];
    }

    private function register(TransactionDraftData $draft): void
    {
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
