<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use App\Enums\BillStatus;
use App\Http\Requests\Api\Concerns\ScopedExists;
use App\Models\Bill;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validação da query de `GET /api/v1/contexts/{context}/bills`. Todos os
 * filtros são opcionais; sem nenhum, devolve todos os boletos do
 * contexto ordenados por vencimento (comportamento anterior a este PR).
 *
 * `status=overdue` é derivado (`status = pending` E `due_date` no
 * passado) — não existe essa linha no banco (ver {@see BillStatus}).
 *
 * NÃO pagina nem aplica regra de negócio. A query fica em
 * {@see Bill::scopeApplyFilters()}.
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
final class IndexBillRequest extends FormRequest
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
            'status' => ['nullable', Rule::in(['pending', 'paid', 'overdue', 'cancelled'])],
            'direction' => ['nullable', Rule::in(['payable', 'receivable'])],
            'category_id' => ['nullable', 'integer', $this->existsInRouteContext('categories')],
            'q' => ['nullable', 'string', 'max:150'],
        ];
    }

    /**
     * Filtros já validados, só com as chaves enviadas — pronto para
     * {@see Bill::scopeApplyFilters()}.
     *
     * @return array<string, mixed>
     */
    public function filters(): array
    {
        return array_filter(
            $this->only(['from', 'to', 'status', 'direction', 'category_id', 'q']),
            static fn (mixed $value): bool => $value !== null && $value !== '',
        );
    }
}
