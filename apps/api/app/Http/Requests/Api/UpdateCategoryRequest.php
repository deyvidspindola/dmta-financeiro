<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validação de `PATCH /api/v1/contexts/{context}/categories/{category}`.
 * `parent_id` é opcional (`sometimes`) — omitido não mexe na mãe atual;
 * `null` explícito promove a categoria a raiz.
 *
 * @package App\Http\Requests\Api
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   21/08/2026
 *
 * @updated 16/09/2026
 */
final class UpdateCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'parent_id' => ['sometimes', 'nullable', 'integer'],
            'color' => ['nullable', 'string', 'max:20'],
            'icon' => ['nullable', 'string', 'max:40'],
        ];
    }
}
