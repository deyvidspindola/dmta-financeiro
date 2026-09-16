<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validação de preview/store de importação de extrato (CSV ou PDF).
 * `password` só faz efeito quando o arquivo é PDF protegido; `lines` só
 * entra no store (subconjunto a importar).
 *
 * @package App\Http\Requests\Api
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 2.0.0
 *
 * @since   22/08/2026
 *
 * @updated 16/09/2026
 */
final class StoreStatementImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:csv,txt,pdf', 'max:15360'],
            'password' => ['sometimes', 'nullable', 'string', 'max:200'],
            'lines' => ['sometimes', 'array', 'distinct'],
            'lines.*' => ['integer', 'min:2'],
        ];
    }

    /** @return list<int>|null */
    public function onlyLines(): ?array
    {
        if (! $this->has('lines')) {
            return null;
        }

        return array_map('intval', $this->input('lines', []));
    }
}
