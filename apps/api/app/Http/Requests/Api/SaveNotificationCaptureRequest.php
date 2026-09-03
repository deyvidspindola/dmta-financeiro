<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use App\Http\Requests\Api\Concerns\ScopedExists;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validação de `POST /api/v1/notification-captures/{capture}/save` — a
 * captura não sabe o contexto, então quem salva informa tudo que um
 * lançamento precisa (pré-preenchido pelo app com os palpites). Fora do
 * grupo `contexts/{context}`, então `context_id`/`account_id`/
 * `category_id` são validados contra o próprio usuário ({@see ScopedExists}).
 *
 * @package App\Http\Requests\Api
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   03/09/2026
 *
 * @updated 03/09/2026
 */
final class SaveNotificationCaptureRequest extends FormRequest
{
    use ScopedExists;

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        $contextId = $this->integer('context_id');

        return [
            'context_id' => ['required', 'integer', $this->existsUserContext()],
            'account_id' => ['required', 'integer', $this->existsInContext('accounts', $contextId)],
            'category_id' => ['nullable', 'integer', $this->existsInContext('categories', $contextId)],
            'type' => ['required', Rule::in(['income', 'expense'])],
            'description' => ['required', 'string', 'max:150'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'occurred_at' => ['required', 'date'],
            'force' => ['sometimes', 'boolean'],
        ];
    }
}
