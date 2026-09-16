<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use App\Http\Requests\Api\Concerns\ScopedExists;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validação de `POST /api/v1/contexts/{context}/categories` — consumido
 * pelo modal de cadastro rápido (D-12), nunca uma tela de CRUD.
 * `parent_id` restrito ao `{context}` da rota ({@see ScopedExists}).
 * `color`/`icon` são livres (o cliente escolhe de uma paleta fixa própria,
 * não validada aqui — ver docblock da migration de `categories`).
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
final class StoreCategoryRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:100'],
            'type' => ['required', Rule::in(['expense', 'income'])],
            'parent_id' => ['nullable', 'integer', $this->existsInRouteContext('categories')],
            'color' => ['nullable', 'string', 'max:20'],
            'icon' => ['nullable', 'string', 'max:40'],
        ];
    }
}
