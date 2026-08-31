<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use App\Http\Requests\Api\Concerns\ScopedExists;
use App\UseCases\Transaction\MoveTransactionToContext;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validação de `POST /api/v1/contexts/{context}/transactions/{transaction}/move`.
 * `target_context_id` tem que ser um contexto do próprio usuário;
 * `target_account_id` e `target_category_id`, linhas desse contexto de
 * destino ({@see ScopedExists}). O caso de uso
 * ({@see MoveTransactionToContext}) mantém a checagem como defesa em
 * profundidade.
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
final class MoveTransactionRequest extends FormRequest
{
    use ScopedExists;

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        $targetContextId = $this->integer('target_context_id');

        return [
            'target_context_id' => ['required', 'integer', $this->existsUserContext()],
            'target_account_id' => ['required', 'integer', $this->existsInContext('accounts', $targetContextId)],
            'target_category_id' => ['nullable', 'integer', $this->existsInContext('categories', $targetContextId)],
        ];
    }
}
