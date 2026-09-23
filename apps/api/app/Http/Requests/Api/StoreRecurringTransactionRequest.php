<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use App\Http\Requests\Api\Concerns\ScopedExists;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validação de `POST /api/v1/contexts/{context}/recurring-transactions`.
 * `end_date` nulo = "despesa fixa" (recorrência indefinida) na tela.
 * `account_id` e `category_id` restritos ao `{context}` da rota
 * ({@see ScopedExists}).
 *
 * @package App\Http\Requests\Api
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   21/08/2026
 *
 * @updated 23/09/2026
 */
final class StoreRecurringTransactionRequest extends FormRequest
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
            'account_id' => ['required_without:credit_card_id', 'prohibits:credit_card_id', 'nullable', 'integer', $this->existsInRouteContext('accounts')],
            'credit_card_id' => ['nullable', 'integer', $this->existsInRouteContext('credit_cards')],
            'description' => ['required', 'string', 'max:150'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            // Assinatura no cartão é sempre despesa.
            'type' => ['required', $this->filled('credit_card_id') ? Rule::in(['expense']) : Rule::in(['income', 'expense'])],
            'interval' => ['required', Rule::in(['weekly', 'monthly', 'yearly'])],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'category_id' => ['nullable', 'integer', $this->existsInRouteContext('categories')],
        ];
    }
}
