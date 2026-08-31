<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use App\Http\Requests\Api\Concerns\ScopedExists;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validação de `POST /api/v1/contexts/{context}/budgets`. `category_id`
 * tem que ser uma categoria de despesa do `{context}` da rota
 * ({@see ScopedExists}). `month` opcional — omitido, cria o teto padrão.
 *
 * @package App\Http\Requests\Api
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   02/09/2026
 *
 * @updated 02/09/2026
 */
final class StoreBudgetRequest extends FormRequest
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
            'category_id' => [
                'required',
                'integer',
                $this->existsInRouteContext('categories')->where('type', 'expense'),
            ],
            'limit_amount' => ['required', 'numeric', 'min:0.01'],
            'month' => ['nullable', 'date'],
        ];
    }
}
