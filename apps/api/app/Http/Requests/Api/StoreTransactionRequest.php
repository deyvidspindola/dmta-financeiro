<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validação de `POST /api/v1/contexts/{context}/transactions` (lançamento
 * manual — F0). `account_id`, `category_id` e `bill_id` são checados
 * quanto a pertencer ao mesmo contexto no controller, não aqui (regra de
 * negócio, não formato de campo).
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
final class StoreTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'account_id' => ['required', 'integer', 'exists:accounts,id'],
            'description' => ['required', 'string', 'max:150'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'type' => ['required', Rule::in(['income', 'expense', 'transfer'])],
            'occurred_at' => ['required', 'date'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'bill_id' => ['nullable', 'integer', 'exists:bills,id'],
        ];
    }
}
