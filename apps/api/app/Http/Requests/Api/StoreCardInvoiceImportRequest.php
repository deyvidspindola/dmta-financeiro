<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validação de preview/store de importação de fatura de cartão CSV.
 *
 * @package App\Http\Requests\Api
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   03/09/2026
 *
 * @updated 03/09/2026
 */
final class StoreCardInvoiceImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:4096'],
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
