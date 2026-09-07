<?php

declare(strict_types=1);

namespace App\UseCases\Settings;

use App\Services\TelegramBotClient;

/**
 * Botão "testar conexão" do Telegram na tela de integrações: valida o
 * token (`getMe`) e, se o chat autorizado estiver configurado, manda uma
 * mensagem de teste pra ele. Devolve o resultado pra tela mostrar — não
 * lança: a falha aqui é informação, não erro de domínio.
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
final class TestTelegramConnection
{
    public function __construct(private readonly TelegramBotClient $client) {}

    /**
     * @return array{ok: bool, bot?: string|null, message_sent?: bool, error?: string}
     */
    public function execute(): array
    {
        $token = config('services.telegram.bot_token');

        if (! $token) {
            return ['ok' => false, 'error' => 'Configure e salve o token do bot primeiro.'];
        }

        $me = $this->client->getMe((string) $token);

        if ($me['ok'] !== true) {
            return ['ok' => false, 'error' => $me['description'] ?? 'Token inválido.'];
        }

        $chatId = config('services.telegram.allowed_chat_id');
        $messageSent = false;

        if ($chatId) {
            $this->client->sendMessage(
                (string) $chatId,
                'DMTA Financeiro — teste de conexão do bot. Se você recebeu isto, está tudo certo.',
            );
            $messageSent = true;
        }

        return [
            'ok' => true,
            'bot' => $me['username'] ?? null,
            'message_sent' => $messageSent,
        ];
    }
}
