<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use App\Http\Requests\Api\Concerns\ScopedExists;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validação de
 * `POST /api/v1/contexts/{context}/credit-cards/{creditCard}/invoices/{invoice}/pay`.
 * `account_id` (a conta de onde sai o dinheiro) restrito ao `{context}`
 * da rota ({@see ScopedExists}).
 *
 * @package App\Http\Requests\Api
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   01/09/2026
 *
 * @updated 01/09/2026
 */
final class PayCardInvoiceRequest extends FormRequest
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
            'account_id' => ['required', 'integer', $this->existsInRouteContext('accounts')],
            'occurred_at' => ['nullable', 'date'],
        ];
    }
}
