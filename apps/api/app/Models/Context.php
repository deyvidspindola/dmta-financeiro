<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ContextType;
use Database\Factories\ContextFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'company_id', 'type', 'name'])]
/**
 * Contexto de trabalho: PF de um usuário, ou uma de suas empresas.
 * Isolamento de dado do sistema inteiro passa por aqui — ver comentário na
 * migration `create_contexts_table`.
 *
 * @property-read ContextType $type
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
class Context extends Model
{
    /** @use HasFactory<ContextFactory> */
    use HasFactory;

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Company, $this> */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /** @return HasMany<Account, $this> */
    public function accounts(): HasMany
    {
        return $this->hasMany(Account::class);
    }

    /** @return HasMany<Category, $this> */
    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    /** @return HasMany<Bill, $this> */
    public function bills(): HasMany
    {
        return $this->hasMany(Bill::class);
    }

    /** @return HasMany<Debt, $this> */
    public function debts(): HasMany
    {
        return $this->hasMany(Debt::class);
    }

    /** @return HasMany<Goal, $this> */
    public function goals(): HasMany
    {
        return $this->hasMany(Goal::class);
    }

    /** @return HasMany<Budget, $this> */
    public function budgets(): HasMany
    {
        return $this->hasMany(Budget::class);
    }

    /** @return HasMany<StatementEntry, $this> */
    public function statementEntries(): HasMany
    {
        return $this->hasMany(StatementEntry::class);
    }

    /**
     * Alias de {@see statementEntries()} — existe só porque o
     * `scopeBindings()` das rotas resolve `{transaction}` chamando
     * `Str::plural(Str::camel('transaction'))` = `transactions()`, não
     * o nome real da relação. Sem isto, toda rota
     * `contexts/{context}/transactions/{transaction}` quebra com "Call
     * to undefined method" (bug real encontrado em produção, não
     * hipotético — ver Model::childRouteBindingRelationshipName()).
     *
     * @return HasMany<StatementEntry, $this>
     */
    public function transactions(): HasMany
    {
        return $this->statementEntries();
    }

    /** @return HasMany<CreditCard, $this> */
    public function creditCards(): HasMany
    {
        return $this->hasMany(CreditCard::class);
    }

    /** @return HasMany<Investment, $this> */
    public function investments(): HasMany
    {
        return $this->hasMany(Investment::class);
    }

    /** @return HasMany<RecurringTransaction, $this> */
    public function recurringTransactions(): HasMany
    {
        return $this->hasMany(RecurringTransaction::class);
    }

    /** @return HasMany<RecurringBill, $this> */
    public function recurringBills(): HasMany
    {
        return $this->hasMany(RecurringBill::class);
    }

    /** Se este é o contexto pessoa física do usuário. */
    public function isPf(): bool
    {
        // @phpstan-ignore-next-line identical.alwaysFalse (cast ContextType confirmado em runtime — larastan erra os dois lados dessa inferência)
        return $this->type === ContextType::Pf;
    }

    /**
     * Converte atributos para tipos de domínio.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => ContextType::class,
        ];
    }
}
