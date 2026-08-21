<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validação de `POST /api/v1/contexts`. Quando `type` é `company`, exige
 * os dados da empresa nova — este endpoint sempre cria a empresa junto
 * (não existe fluxo de "ligar a uma empresa já cadastrada por outro
 * contexto", fora de escopo da F0).
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
final class StoreContextRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(['pf', 'company'])],
            'name' => ['required', 'string', 'max:100'],
            'company_name' => ['required_if:type,company', 'string', 'max:150'],
            'company_document' => ['nullable', 'string', 'max:20'],
        ];
    }
}
