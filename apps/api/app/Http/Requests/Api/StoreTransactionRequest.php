<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use App\Http\Requests\Api\Concerns\ScopedExists;
use App\UseCases\Transaction\TransferBetweenAccounts;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validação de `POST /api/v1/contexts/{context}/transactions` (lançamento
 * manual — F0). `account_id`, `category_id`, `bill_id` e `goal_id` são
 * restritos ao `{context}` da rota ({@see ScopedExists}) — sem isso, um
 * id de conta/boleto de outro contexto do usuário era aceito e movia o
 * saldo dele.
 *
 * `transfer` não é um tipo aceito aqui — transferência tem endpoint
 * próprio (`POST .../transfers`, {@see TransferBetweenAccounts}),
 * uma única perna não representa uma transferência corretamente.
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
final class StoreTransactionRequest extends FormRequest
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
            'description' => ['required', 'string', 'max:150'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'type' => ['required', Rule::in(['income', 'expense'])],
            'occurred_at' => ['required', 'date'],
            'category_id' => ['nullable', 'integer', $this->existsInRouteContext('categories')],
            'bill_id' => ['nullable', 'integer', $this->existsInRouteContext('bills')],
            'goal_id' => ['nullable', 'integer', $this->existsInRouteContext('goals')],
            // `false` = lançamento previsto (não move saldo até ser
            // efetivado). Omitido = `true` (efetivado na hora, como era).
            'settled' => ['sometimes', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            // Boleto pago já é dinheiro que se moveu — não pode nascer previsto.
            if ($this->has('settled') && ! $this->boolean('settled') && $this->filled('bill_id')) {
                $validator->errors()->add('settled', 'Lançamento vinculado a boleto não pode ser previsto.');
            }
        });
    }
}
