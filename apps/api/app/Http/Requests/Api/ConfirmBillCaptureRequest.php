<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validação de `POST /api/v1/bill-captures/{capture}/confirm` — a
 * pendência não sabe o contexto (ver migration), então quem confirma
 * informa tudo que uma `Bill` de verdade precisa, pré-preenchido pelo
 * client com o que a captura trouxe.
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
final class ConfirmBillCaptureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'context_id' => ['required', 'integer', 'exists:contexts,id'],
            'description' => ['required', 'string', 'max:150'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'due_date' => ['required', 'date'],
            'direction' => ['required', Rule::in(['payable', 'receivable'])],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'beneficiary' => ['nullable', 'string', 'max:150'],
        ];
    }
}
