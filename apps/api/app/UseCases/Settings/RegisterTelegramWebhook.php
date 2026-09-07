<?php

declare(strict_types=1);

namespace App\UseCases\Settings;

use App\Http\Controllers\Api\V1\TelegramWebhookController;
use App\Models\IntegrationSettings;
use App\Services\TelegramBotClient;
use Illuminate\Support\Str;

/**
 * Registra a URL do webhook no Telegram (`setWebhook`) — a tela chama
 * logo depois de salvar o token, e um botão "registrar de novo" repete.
 *
 * Sem `webhook_secret` salvo, gera um e grava — o
 * {@see TelegramWebhookController} exige um
 * pra conferir cada chamada. Marca `telegram_webhook_registered_at` no
 * sucesso. Devolve o resultado pra tela; não lança.
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
final class RegisterTelegramWebhook
{
    public function __construct(private readonly TelegramBotClient $client) {}

    /**
     * @return array{ok: bool, url?: string, error?: string}
     */
    public function execute(): array
    {
        $token = config('services.telegram.bot_token');

        if (! $token) {
            return ['ok' => false, 'error' => 'Configure e salve o token do bot primeiro.'];
        }

        $settings = IntegrationSettings::current();
        $secret = config('services.telegram.webhook_secret') ?: Str::random(48);

        $url = url('api/v1/webhooks/telegram');
        $result = $this->client->setWebhook((string) $token, $url, (string) $secret);

        if ($result['ok'] !== true) {
            return ['ok' => false, 'error' => $result['description'] ?? 'Falha ao registrar o webhook.'];
        }

        $settings->telegram_webhook_secret = $secret;
        // @phpstan-ignore-next-line assign.propertyType (cast 'datetime' — larastan lê a coluna como string)
        $settings->telegram_webhook_registered_at = now();
        $settings->save();

        config(['services.telegram.webhook_secret' => $secret]);

        return ['ok' => true, 'url' => $url];
    }
}
