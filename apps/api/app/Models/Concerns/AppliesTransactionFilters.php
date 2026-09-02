<?php

declare(strict_types=1);

namespace App\Models\Concerns;

use App\Models\StatementEntry;
use Illuminate\Database\Eloquent\Builder;

/**
 * Scope `applyFilters` do {@see StatementEntry} — extraído pra caber no
 * limite de 150 linhas do model (CONVENTIONS.md).
 *
 * @package App\Models\Concerns
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   02/09/2026
 */
trait AppliesTransactionFilters
{
    /**
     * Filtros opcionais de `GET /transactions` (validados em
     * `IndexTransactionRequest`): `from`/`to`, `account_id`, `category_id`,
     * `type`, `q`. Chave ausente não filtra; não pagina nem ordena.
     *
     * @param  Builder<StatementEntry>  $query
     * @param  array<string, mixed>  $filters
     * @return Builder<StatementEntry>
     */
    public function scopeApplyFilters(Builder $query, array $filters): Builder
    {
        return $query
            ->when($filters['from'] ?? null, fn (Builder $q, $v) => $q->whereDate('occurred_at', '>=', $v))
            ->when($filters['to'] ?? null, fn (Builder $q, $v) => $q->whereDate('occurred_at', '<=', $v))
            ->when($filters['account_id'] ?? null, fn (Builder $q, $v) => $q->where('account_id', (int) $v))
            ->when($filters['category_id'] ?? null, fn (Builder $q, $v) => $q->where('category_id', (int) $v))
            ->when($filters['type'] ?? null, fn (Builder $q, $v) => $q->where('type', $v))
            ->when($filters['q'] ?? null, fn (Builder $q, $v) => $q->whereLike('description', '%'.$v.'%'));
    }
}
