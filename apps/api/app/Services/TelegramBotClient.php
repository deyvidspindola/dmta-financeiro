<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Cliente do Telegram Bot API — só os poucos endpoints que o projeto usa
 * (`sendMessage`, `getMe`, `setWebhook`), com `Http` direto em vez de
 * instalar `irazasyed/telegram-bot-sdk`: a exceção da regra "não
 * reimplemente cliente de API de terceiro" é pra clientes com muitos
 * endpoints — aqui são três chamadas HTTP.
 *
 * `sendMessage` nunca propaga falha (perder a resposta ao usuário não
 * pode derrubar o webhook). `getMe` / `setWebhook` são acionados pela
 * tela de integrações e devolvem o resultado cru pra tela mostrar — a
 * falha ali é informação, não erro fatal.
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 2.0.0
 *
 * @since   25/08/2026
 *
 * @updated 07/09/2026
 */
final class TelegramBotClient
{
    private const BASE = 'https://api.telegram.org';

    public function sendMessage(string $chatId, string $text): void
    {
        $token = config('services.telegram.bot_token');

        if (! $token) {
            Log::debug('Telegram: bot_token não configurado, mensagem não enviada.', ['chat_id' => $chatId]);

            return;
        }

        try {
            $response = Http::timeout(5)->post(self::BASE."/bot{$token}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $text,
            ]);

            if (($response->json('ok') ?? false) !== true) {
                Log::warning('Telegram: sendMessage recusado.', [
                    'channel' => 'telegram',
                    'chat_id' => $chatId,
                    'description' => $response->json('description'),
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('Telegram: falha ao enviar mensagem.', ['chat_id' => $chatId, 'error' => $e->getMessage()]);
        }
    }

    /**
     * `getWebhookInfo` — o que o Telegram sabe do webhook agora: URL
     * registrada, updates pendentes e, o mais útil, o último erro de
     * entrega (`last_error_message`). Devolve o `result` cru.
     *
     * @return array{ok: bool, description?: string, result?: array<string, mixed>}
     */
    public function getWebhookInfo(string $token): array
    {
        try {
            $response = Http::timeout(8)->get(self::BASE."/bot{$token}/getWebhookInfo");
        } catch (\Throwable $e) {
            return ['ok' => false, 'description' => $e->getMessage()];
        }

        $body = $response->json();

        if (! is_array($body) || ($body['ok'] ?? false) !== true) {
            return ['ok' => false, 'description' => is_array($body) ? ($body['description'] ?? 'Resposta inesperada.') : 'Resposta inesperada.'];
        }

        return ['ok' => true, 'result' => $body['result'] ?? []];
    }

    /**
     * Valida o token e devolve os dados do bot (`getMe`).
     *
     * @return array{ok: bool, description?: string, username?: string, name?: string}
     */
    public function getMe(string $token): array
    {
        try {
            $response = Http::timeout(8)->get(self::BASE."/bot{$token}/getMe");
        } catch (\Throwable $e) {
            return ['ok' => false, 'description' => $e->getMessage()];
        }

        $body = $response->json();

        if (! is_array($body) || ($body['ok'] ?? false) !== true) {
            return ['ok' => false, 'description' => is_array($body) ? ($body['description'] ?? 'Token inválido.') : 'Resposta inesperada do Telegram.'];
        }

        return [
            'ok' => true,
            'username' => $body['result']['username'] ?? null,
            'name' => $body['result']['first_name'] ?? null,
        ];
    }

    /**
     * Registra a URL do webhook no Telegram, com o `secret_token` que o
     * `TelegramWebhookController` confere em cada chamada.
     *
     * @return array{ok: bool, description?: string}
     */
    public function setWebhook(string $token, string $url, string $secret): array
    {
        try {
            $response = Http::timeout(8)->post(self::BASE."/bot{$token}/setWebhook", [
                'url' => $url,
                'secret_token' => $secret,
                'allowed_updates' => ['message'],
            ]);
        } catch (\Throwable $e) {
            return ['ok' => false, 'description' => $e->getMessage()];
        }

        $body = $response->json();

        if (! is_array($body) || ($body['ok'] ?? false) !== true) {
            return ['ok' => false, 'description' => is_array($body) ? ($body['description'] ?? 'Falha ao registrar o webhook.') : 'Resposta inesperada do Telegram.'];
        }

        return ['ok' => true, 'description' => $body['description'] ?? 'Webhook registrado.'];
    }
}
