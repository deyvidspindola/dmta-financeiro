<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use App\Http\Requests\Api\Concerns\ScopedExists;
use App\Models\StatementEntry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validação da query de `GET /api/v1/contexts/{context}/transactions`.
 * Todos os filtros são opcionais; sem nenhum, a listagem devolve o
 * extrato inteiro do contexto (comportamento anterior a este PR).
 *
 * `account_id` e `category_id` são restritos ao `{context}` da rota
 * ({@see ScopedExists}) — um id de outro contexto vira 422, não uma
 * lista vazia silenciosa.
 *
 * NÃO pagina o resultado nem valida regra de negócio — só a forma dos
 * parâmetros de filtro. A montagem da query fica em
 * {@see StatementEntry::scopeApplyFilters()}.
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
final class IndexTransactionRequest extends FormRequest
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
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'account_id' => ['nullable', 'integer', $this->existsInRouteContext('accounts')],
            'category_id' => ['nullable', 'integer', $this->existsInRouteContext('categories')],
            'type' => ['nullable', Rule::in(['income', 'expense', 'transfer'])],
            'q' => ['nullable', 'string', 'max:150'],
        ];
    }

    /**
     * Filtros já validados, só com as chaves que o cliente enviou —
     * pronto para {@see StatementEntry::scopeApplyFilters()}.
     *
     * @return array<string, mixed>
     */
    public function filters(): array
    {
        return array_filter(
            $this->only(['from', 'to', 'account_id', 'category_id', 'type', 'q']),
            static fn (mixed $value): bool => $value !== null && $value !== '',
        );
    }
}
