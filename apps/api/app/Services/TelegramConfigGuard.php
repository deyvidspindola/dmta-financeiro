<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;

/**
 * Checa se o bot do Telegram está configurado o suficiente pra atender
 * esta mensagem: chat autorizado bate, e o e-mail do dono corresponde a
 * um usuário. Devolve `[outcome, detalhe, resposta]` pro caller mandar de
 * volta e registrar, ou `null` se está tudo certo.
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
final class TelegramConfigGuard
{
    /** @return array{0: string, 1: ?string, 2: string}|null */
    public function check(string $chatId): ?array
    {
        $allowed = config('services.telegram.allowed_chat_id');

        if (! $allowed) {
            return ['not_configured', null, "Seu chat ID é {$chatId}. Cole ele em Integrações → Telegram pra ativar o bot."];
        }

        if ((string) $allowed !== $chatId) {
            return ['chat_not_authorized', "recebido {$chatId}, autorizado {$allowed}", "Este chat (ID {$chatId}) não é o autorizado. Ajuste em Integrações → Telegram."];
        }

        $email = config('services.telegram.user_email');

        if (blank($email) || ! User::query()->where('email', $email)->exists()) {
            return ['owner_not_found', $email ? "email: {$email}" : 'sem email', 'Configuração incompleta: em Integrações → Telegram, "E-mail do dono" precisa ser o e-mail da sua conta no app. Está como '.($email ?: 'vazio').'.'];
        }

        return null;
    }
}
