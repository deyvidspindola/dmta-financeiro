<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validação de `PATCH /api/v1/contexts/{context}/debts/{debt}`. Direção
 * não é editável aqui — ver docblock de `UpdateDebtData`.
 *
 * @package App\Http\Requests\Api
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   22/08/2026
 *
 * @updated 22/08/2026
 */
final class UpdateDebtRequest extends FormRequest
{
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
            'counterparty' => ['nullable', 'string', 'max:150'],
            'due_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
