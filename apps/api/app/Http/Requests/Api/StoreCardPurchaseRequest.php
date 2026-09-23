<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use App\Http\Requests\Api\Concerns\ScopedExists;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validação de `POST /api/v1/contexts/{context}/credit-cards/{creditCard}/purchases`.
 * `category_id` restrito ao `{context}` da rota ({@see ScopedExists}).
 * `recurring=true` (assinatura) exige `interval` e não combina com
 * parcelamento.
 *
 * @package App\Http\Requests\Api
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   01/09/2026
 *
 * @updated 23/09/2026
 */
final class StoreCardPurchaseRequest extends FormRequest
{
    use ScopedExists;

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'description' => ['required', 'string', 'max:150'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'occurred_at' => ['required', 'date'],
            'category_id' => ['nullable', 'integer', $this->existsInRouteContext('categories')],
            'installments' => ['nullable', 'integer', 'min:1', 'max:48', Rule::when($this->boolean('recurring'), ['max:1'])],
            'recurring' => ['sometimes', 'boolean'],
            'interval' => ['required_if_accepted:recurring', 'nullable', Rule::in(['weekly', 'monthly', 'yearly'])],
            'end_date' => ['nullable', 'date', 'after_or_equal:occurred_at'],
        ];
    }
}
