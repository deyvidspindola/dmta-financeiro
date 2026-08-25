<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Envia mensagem de volta pro chat via Telegram Bot API — um único
 * endpoint (`sendMessage`), então `Http::post` direto em vez de instalar
 * `irazasyed/telegram-bot-sdk` (sugestão do capítulo 6.4): a exceção da
 * regra "não reimplemente cliente de API de terceiro" é pra clientes com
 * muitos endpoints — aqui é uma chamada HTTP, o SDK seria superfície
 * maior que o problema.
 *
 * Sem `TELEGRAM_BOT_TOKEN` configurado, não tenta a chamada — só loga em
 * debug (mesmo padrão de "desligado até configurar" da F1). Falha de
 * rede/API nunca propaga pro caller: perder a resposta ao usuário é
 * ruim, mas não deve derrubar o webhook nem impedir o lançamento de ter
 * sido registrado.
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   25/08/2026
 *
 * @updated 25/08/2026
 */
final class TelegramBotClient
{
    public function sendMessage(string $chatId, string $text): void
    {
        $token = config('services.telegram.bot_token');

        if (! $token) {
            Log::debug('Telegram: bot_token não configurado, mensagem não enviada.', ['chat_id' => $chatId]);

            return;
        }

        try {
            Http::timeout(5)->post("https://api.telegram.org/bot{$token}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $text,
            ]);
        } catch (\Throwable $e) {
            Log::warning('Telegram: falha ao enviar mensagem.', ['chat_id' => $chatId, 'error' => $e->getMessage()]);
        }
    }
}
