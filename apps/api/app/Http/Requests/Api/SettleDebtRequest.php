<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use App\Http\Requests\Api\Concerns\ScopedExists;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validação de `POST /api/v1/contexts/{context}/debts/{debt}/settle`.
 * `account_id` é opcional — omitido, só marca a dívida como quitada
 * (D-15); informado, a quitação também gera um lançamento nessa conta,
 * que precisa ser do `{context}` da rota ({@see ScopedExists}).
 *
 * @package App\Http\Requests\Api
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   31/08/2026
 *
 * @updated 31/08/2026
 */
final class SettleDebtRequest extends FormRequest
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
            'account_id' => ['nullable', 'integer', $this->existsInRouteContext('accounts')],
            'occurred_at' => ['nullable', 'date'],
        ];
    }
}
