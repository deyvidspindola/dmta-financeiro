<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\TelegramWebhookEvent;
use App\UseCases\Capture\HandleTelegramMessage;

/**
 * Grava uma linha por chamada do webhook do Telegram
 * ({@see TelegramWebhookEvent}) e poda o histórico para as últimas 40 —
 * é só diagnóstico, não é log de auditoria. Usado pelo Controller do
 * webhook e por {@see HandleTelegramMessage}.
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   07/09/2026
 *
 * @updated 07/09/2026
 */
final class TelegramWebhookRecorder
{
    private const KEEP = 40;

    public function record(?string $chatId, ?string $text, string $outcome, ?string $detail = null, bool $replySent = false): void
    {
        TelegramWebhookEvent::query()->create([
            'chat_id' => $chatId,
            'message_text' => $text !== null ? mb_substr($text, 0, 500) : null,
            'outcome' => $outcome,
            'detail' => $detail,
            'reply_sent' => $replySent,
        ]);

        $cutoff = TelegramWebhookEvent::query()
            ->orderByDesc('id')
            ->skip(self::KEEP)
            ->value('id');

        if ($cutoff !== null) {
            TelegramWebhookEvent::query()->where('id', '<=', $cutoff)->delete();
        }
    }
}
