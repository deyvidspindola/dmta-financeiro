<?php

declare(strict_types=1);

namespace App\UseCases\Capture;

use App\Domain\Capture\QuickEntryChannelInterface;
use App\Domain\Capture\QuickEntryStep;
use App\DTOs\RegisterTransactionData;
use App\DTOs\TransactionDraftData;
use App\Enums\CaptureOrigin;
use App\Services\TelegramBotClient;
use App\Services\TelegramCategoryReclassifier;
use App\Services\TelegramConfigGuard;
use App\Services\TelegramReplyFormatter;
use App\Services\TelegramWebhookRecorder;
use App\UseCases\Transaction\RegisterTransaction;

/**
 * Uma mensagem do bot do Telegram: confere a config, trata "cancelar" /
 * "desfazer", passa o resto pro assistente ({@see QuickEntryChannelInterface})
 * e, quando o rascunho completa, registra o lançamento. Sempre responde
 * algo e grava o desfecho em {@see TelegramWebhookRecorder}.
 *
 * @package App\UseCases\Capture
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 3.0.0
 *
 * @since   25/08/2026
 *
 * @updated 07/09/2026
 */
final class HandleTelegramMessage
{
    private const CANCEL_WORDS = ['cancelar', 'cancela', 'cancel', 'parar', 'sair'];

    private const UNDO_WORDS = ['desfazer', 'desfaz', 'apagar', 'errado'];

    private const CATEGORY_WORDS = ['categoria', 'categoría', 'cat', 'trocar categoria', 'mudar categoria', 'corrigir categoria'];

    public function __construct(
        private readonly QuickEntryChannelInterface $channel,
        private readonly TelegramBotClient $bot,
        private readonly TelegramConfigGuard $guard,
        private readonly RegisterTransaction $registerTransaction,
        private readonly UndoLastTelegramEntry $undoLast,
        private readonly TelegramCategoryReclassifier $reclassify,
        private readonly TelegramReplyFormatter $formatter,
        private readonly TelegramWebhookRecorder $recorder,
    ) {}

    public function execute(string $chatId, string $message): void
    {
        [$outcome, $detail, $reply] = $this->resolve($chatId, $message);

        $this->bot->sendMessage($chatId, $reply);
        $this->recorder->record($chatId, $message, $outcome, $detail, replySent: true);
    }

    /** @return array{0: string, 1: ?string, 2: string} */
    private function resolve(string $chatId, string $message): array
    {
        if (($error = $this->guard->check($chatId)) !== null) {
            return $error;
        }

        $word = mb_strtolower(trim($message));

        if (in_array($word, self::CANCEL_WORDS, true)) {
            $this->channel->cancel($chatId);

            return ['cancelled', null, 'Cancelei. Manda o valor e uma descrição pra começar (ex.: "gastei 45 no mercado").'];
        }

        if (in_array($word, self::UNDO_WORDS, true)) {
            return $this->undoLast->execute($chatId)
                ? ['undone', null, '↩️ Desfeito — o lançamento foi apagado.']
                : ['undo_nothing', null, 'Nada recente pra desfazer aqui.'];
        }

        if ($this->reclassify->isAwaiting($chatId)) {
            return $this->reclassify->apply($chatId, $message);
        }

        if (in_array($word, self::CATEGORY_WORDS, true)) {
            return $this->reclassify->start($chatId);
        }

        $step = $this->channel->handle($chatId, $message);

        return match ($step->kind) {
            'ready' => $this->register($chatId, $step),
            'cancelled' => ['cancelled', null, $step->reply],
            'not_understood' => ['help_sent', null, $step->reply],
            default => ['awaiting_reply', null, $step->reply],
        };
    }

    /** @return array{0: string, 1: ?string, 2: string} */
    private function register(string $chatId, QuickEntryStep $step): array
    {
        /** @var TransactionDraftData $draft */
        $draft = $step->draft;

        $entry = $this->registerTransaction->execute(
            RegisterTransactionData::fromDraft($draft, CaptureOrigin::Telegram),
        );

        $this->channel->markRegistered($chatId, $entry->id);

        return ['registered', "txn:{$entry->id}", $this->formatter->registered($entry)];
    }
}
