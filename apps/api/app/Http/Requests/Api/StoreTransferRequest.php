<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validação de `POST /api/v1/contexts/{context}/transfers`. `to_context_id`
 * é opcional — omitido, a transferência é dentro do próprio `{context}`
 * da URL (comportamento de sempre); informado, pode ser qualquer outro
 * contexto do usuário (PF ⇄ empresa, ou entre duas empresas). Contas
 * pertencerem mesmo aos contextos informados é checado no caso de uso,
 * não aqui (regra de negócio, não formato de campo).
 *
 * @package App\Http\Requests\Api
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final class StoreTransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'from_account_id' => ['required', 'integer', 'exists:accounts,id'],
            'to_account_id' => ['required', 'integer', 'exists:accounts,id'],
            'to_context_id' => ['nullable', 'integer', 'exists:contexts,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'description' => ['required', 'string', 'max:150'],
            'occurred_at' => ['required', 'date'],
        ];
    }
}
