<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validação de `POST /api/v1/contexts/{context}/accounts`.
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
final class StoreAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'type' => ['sometimes', Rule::in(['checking', 'savings', 'wallet', 'other'])],
            'institution' => ['nullable', 'string', 'max:100'],
            'initial_balance' => ['sometimes', 'numeric'],
            'include_in_dashboard' => ['sometimes', 'boolean'],
            'color' => ['nullable', 'string', 'max:20'],
        ];
    }
}
