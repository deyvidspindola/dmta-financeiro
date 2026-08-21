<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use App\UseCases\Transaction\MoveTransactionToContext;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validação de `POST /api/v1/contexts/{context}/transactions/{transaction}/move`.
 * `target_context_id` não é validado contra o dono aqui — o caso de uso
 * ({@see MoveTransactionToContext}) confere
 * indiretamente, porque a conta de destino tem que pertencer a ele.
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
final class MoveTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'target_context_id' => ['required', 'integer', 'exists:contexts,id'],
            'target_account_id' => ['required', 'integer', 'exists:accounts,id'],
            'target_category_id' => ['nullable', 'integer', 'exists:categories,id'],
        ];
    }
}
