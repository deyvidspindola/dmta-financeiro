<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\AccountType;
use App\Enums\StatementEntryType;
use App\Http\Resources\AccountResource;
use Database\Factories\AccountFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['context_id', 'name', 'type', 'institution', 'initial_balance', 'balance', 'include_in_dashboard', 'color'])]
/**
 * Conta bancária de cadastro manual. `balance` é mantido pelos casos de
 * uso que criam {@see StatementEntry} — nunca recalculado por query
 * agregada na leitura (ver migration para o porquê).
 *
 * @property-read AccountType $type
 *
 * @package App\Models
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
class Account extends Model
{
    /** @use HasFactory<AccountFactory> */
    use HasFactory;

    /** @return BelongsTo<Context, $this> */
    public function context(): BelongsTo
    {
        return $this->belongsTo(Context::class);
    }

    /** @return HasMany<StatementEntry, $this> */
    public function statementEntries(): HasMany
    {
        return $this->hasMany(StatementEntry::class);
    }

    /**
     * Carrega `pending_income_sum`/`pending_expense_sum` que
     * {@see AccountResource} soma no `balance` pra
     * formar o `projected_balance`.
     *
     * @param  Builder<Account>  $query
     * @return Builder<Account>
     */
    public function scopeWithPendingSums(Builder $query): Builder
    {
        return $query
            ->withSum(
                ['statementEntries as pending_income_sum' => fn ($q) => $q->pending()->where('type', StatementEntryType::Income->value)],
                'amount',
            )
            ->withSum(
                ['statementEntries as pending_expense_sum' => fn ($q) => $q->pending()->where('type', StatementEntryType::Expense->value)],
                'amount',
            );
    }

    /**
     * Converte atributos para tipos de domínio.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => AccountType::class,
            'initial_balance' => 'decimal:2',
            'balance' => 'decimal:2',
            'include_in_dashboard' => 'boolean',
        ];
    }
}
