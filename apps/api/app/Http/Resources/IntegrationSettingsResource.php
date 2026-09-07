<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\IntegrationSettings;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Formato de saída da configuração de integrações.
 *
 * Nunca devolve segredo em claro: token do bot, secret do webhook e senha
 * do IMAP saem só como booleano "configurado". `*_from_env` avisa a tela
 * que o valor efetivo está vindo do `.env` (não foi salvo aqui) — útil
 * pra não mostrar "não configurado" quando o deploy já tem a variável.
 *
 * @mixin IntegrationSettings
 *
 * @package App\Http\Resources
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   07/09/2026
 *
 * @updated 07/09/2026
 */
final class IntegrationSettingsResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'telegram' => [
                'configured' => (bool) config('services.telegram.bot_token'),
                'bot_token_set' => filled($this->telegram_bot_token),
                'bot_token_from_env' => blank($this->telegram_bot_token) && filled(config('services.telegram.bot_token')),
                'webhook_secret_set' => filled($this->telegram_webhook_secret) || filled(config('services.telegram.webhook_secret')),
                'allowed_chat_id' => $this->telegram_allowed_chat_id ?? config('services.telegram.allowed_chat_id'),
                'user_email' => $this->telegram_user_email ?? config('services.telegram.user_email'),
                // @phpstan-ignore-next-line method.nonObject (cast 'datetime' da migration — larastan não infere casts() aqui)
                'webhook_registered_at' => $this->telegram_webhook_registered_at?->toIso8601String(),
                'webhook_url' => url('/api/v1/webhooks/telegram'),
            ],
            'boleto_mailbox' => [
                'enabled' => (bool) config('services.boleto_mailbox.enabled'),
                'host' => $this->boleto_mailbox_host ?? config('services.boleto_mailbox.host'),
                'port' => (int) ($this->boleto_mailbox_port ?? config('services.boleto_mailbox.port', 993)),
                'encryption' => $this->boleto_mailbox_encryption ?? config('services.boleto_mailbox.encryption', 'ssl'),
                'username' => $this->boleto_mailbox_username ?? config('services.boleto_mailbox.username'),
                'password_set' => filled($this->boleto_mailbox_password) || filled(config('services.boleto_mailbox.password')),
                'password_from_env' => blank($this->boleto_mailbox_password) && filled(config('services.boleto_mailbox.password')),
            ],
        ];
    }
}
