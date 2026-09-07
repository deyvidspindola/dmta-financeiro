<?php

declare(strict_types=1);

namespace App\Models;

use App\Providers\AppServiceProvider;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'telegram_bot_token',
    'telegram_webhook_secret',
    'telegram_allowed_chat_id',
    'telegram_user_email',
    'telegram_webhook_registered_at',
    'boleto_mailbox_enabled',
    'boleto_mailbox_host',
    'boleto_mailbox_port',
    'boleto_mailbox_encryption',
    'boleto_mailbox_username',
    'boleto_mailbox_password',
])]
/**
 * Configuração das integrações da F1 (Telegram e caixa IMAP de boletos),
 * editável por tela. Linha única — sempre acessada por {@see self::current()}.
 *
 * O valor gravado aqui tem precedência sobre o `.env` (o overlay acontece
 * em {@see AppServiceProvider::boot()}). Não concentra
 * regra de negócio: só guarda os campos, cifrando os sensíveis.
 *
 * @package App\Models
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   07/09/2026
 *
 * @updated 07/09/2026
 */
class IntegrationSettings extends Model
{
    /** A linha singleton — não faz sentido criar mais de uma. */
    public function getKeyName(): string
    {
        return 'id';
    }

    /**
     * A linha de configuração como instância — ainda não persistida se
     * nunca foi salva (não escreve no banco só por ler). O overlay de
     * `config` no boot usa `query()->first()` direto e ignora quando é
     * `null`; aqui é o caminho de leitura/escrita da tela.
     */
    public static function current(): self
    {
        return static::query()->firstOrNew([]);
    }

    /**
     * `true` quando o bot do Telegram tem token configurado — mesmo
     * critério de "ligado" que o `.env` sempre usou.
     */
    public function telegramConfigured(): bool
    {
        return filled($this->telegram_bot_token);
    }

    /**
     * Valores para sobrescrever `config('services.*')` — só as chaves
     * preenchidas aqui; o resto continua vindo do `.env`.
     *
     * @return array<string, mixed>
     */
    public function servicesConfigOverrides(): array
    {
        $map = [
            'services.telegram.bot_token' => $this->telegram_bot_token,
            'services.telegram.webhook_secret' => $this->telegram_webhook_secret,
            'services.telegram.allowed_chat_id' => $this->telegram_allowed_chat_id,
            'services.telegram.user_email' => $this->telegram_user_email,
            'services.boleto_mailbox.host' => $this->boleto_mailbox_host,
            'services.boleto_mailbox.port' => $this->boleto_mailbox_port,
            'services.boleto_mailbox.encryption' => $this->boleto_mailbox_encryption,
            'services.boleto_mailbox.username' => $this->boleto_mailbox_username,
            'services.boleto_mailbox.password' => $this->boleto_mailbox_password,
        ];

        $overrides = array_filter($map, fn ($value): bool => filled($value));

        // O "ligado" da caixa é explícito: só sobrepõe quando marcado aqui.
        if ($this->boleto_mailbox_enabled) {
            $overrides['services.boleto_mailbox.enabled'] = true;
        }

        return $overrides;
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'telegram_bot_token' => 'encrypted',
            'telegram_webhook_secret' => 'encrypted',
            'boleto_mailbox_password' => 'encrypted',
            'boleto_mailbox_enabled' => 'boolean',
            'boleto_mailbox_port' => 'integer',
            'telegram_webhook_registered_at' => 'datetime',
        ];
    }
}
