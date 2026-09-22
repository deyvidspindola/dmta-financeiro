<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use App\Enums\RecurrenceEditScope;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validação da query de `DELETE /api/v1/contexts/{context}/transactions/{transaction}`.
 * `scope` só faz sentido pra lançamento vindo de recorrência — sem
 * `recurring_transaction_id`, o controller ignora e apaga só o próprio
 * lançamento (comportamento anterior a este PR).
 *
 * @package App\Http\Requests\Api
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   22/09/2026
 */
final class DeleteTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'scope' => ['nullable', Rule::in(array_column(RecurrenceEditScope::cases(), 'value'))],
        ];
    }

    public function scope(): RecurrenceEditScope
    {
        return RecurrenceEditScope::tryFrom((string) $this->query('scope')) ?? RecurrenceEditScope::This;
    }
}
