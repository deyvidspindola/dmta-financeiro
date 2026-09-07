<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validação de `PUT /api/v1/integrations` (tela de integrações da F1).
 *
 * Todo campo é `sometimes`: a tela manda só a seção que o usuário mexeu
 * (Telegram ou caixa de boletos), e `validated()` devolve só o que veio —
 * o caso de uso aplica exatamente isso. Campo com `null` limpa o valor;
 * campo ausente fica como está. Um campo sensível em branco na tela =
 * ausente no payload = mantém o que já estava salvo.
 *
 * @package App\Http\Requests\Api
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   07/09/2026
 *
 * @updated 07/09/2026
 */
final class UpdateIntegrationSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'telegram_bot_token' => ['sometimes', 'nullable', 'string', 'max:255'],
            'telegram_webhook_secret' => ['sometimes', 'nullable', 'string', 'max:255'],
            'telegram_allowed_chat_id' => ['sometimes', 'nullable', 'string', 'max:64'],
            'telegram_user_email' => ['sometimes', 'nullable', 'email', 'max:255'],

            'boleto_mailbox_enabled' => ['sometimes', 'boolean'],
            'boleto_mailbox_host' => ['sometimes', 'nullable', 'string', 'max:255'],
            'boleto_mailbox_port' => ['sometimes', 'integer', 'min:1', 'max:65535'],
            'boleto_mailbox_encryption' => ['sometimes', 'nullable', Rule::in(['ssl', 'tls', 'starttls', 'none'])],
            'boleto_mailbox_username' => ['sometimes', 'nullable', 'string', 'max:255'],
            'boleto_mailbox_password' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }
}
