<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use App\Http\Requests\Api\Concerns\ScopedExists;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validação de `POST /api/v1/contexts/{context}/transfers`. `to_context_id`
 * é opcional — omitido, a transferência é dentro do próprio `{context}`
 * da URL; informado, tem que ser outro contexto do usuário. A conta de
 * origem pertence ao `{context}` da rota; a de destino, ao contexto de
 * destino ({@see ScopedExists}). O caso de uso mantém a checagem
 * (`AccountContextMismatchException`) como defesa em profundidade.
 *
 * @package App\Http\Requests\Api
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 2.0.0
 *
 * @since   21/08/2026
 *
 * @updated 31/08/2026
 */
final class StoreTransferRequest extends FormRequest
{
    use ScopedExists;

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        $toContextId = $this->filled('to_context_id')
            ? $this->integer('to_context_id')
            : $this->routeContext()->id;

        return [
            'from_account_id' => ['required', 'integer', $this->existsInRouteContext('accounts')],
            'to_account_id' => ['required', 'integer', $this->existsInContext('accounts', $toContextId)],
            'to_context_id' => ['nullable', 'integer', $this->existsUserContext()],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'description' => ['required', 'string', 'max:150'],
            'occurred_at' => ['required', 'date'],
        ];
    }
}
