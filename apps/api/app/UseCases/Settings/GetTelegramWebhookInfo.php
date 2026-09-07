<?php

declare(strict_types=1);

namespace App\UseCases\Settings;

use App\Services\TelegramBotClient;

/**
 * "Ver status do webhook" na tela de integrações — passa adiante o
 * `getWebhookInfo` do Telegram (URL registrada, updates pendentes,
 * `last_error_message`). É a resposta pra "configurei mas o bot não
 * responde".
 *
 * @package App\UseCases\Settings
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   07/09/2026
 *
 * @updated 07/09/2026
 */
final class GetTelegramWebhookInfo
{
    public function __construct(private readonly TelegramBotClient $client) {}

    /**
     * @return array{ok: bool, error?: string, result?: array<string, mixed>}
     */
    public function execute(): array
    {
        $token = config('services.telegram.bot_token');

        if (! $token) {
            return ['ok' => false, 'error' => 'Configure e salve o token do bot primeiro.'];
        }

        $info = $this->client->getWebhookInfo((string) $token);

        if ($info['ok'] !== true) {
            return ['ok' => false, 'error' => $info['description'] ?? 'Falha ao consultar.'];
        }

        return ['ok' => true, 'result' => $info['result'] ?? []];
    }
}
