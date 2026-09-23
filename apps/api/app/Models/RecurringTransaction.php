<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\RecurrenceInterval;
use App\Enums\StatementEntryType;
use Database\Factories\RecurringTransactionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

#[Fillable([
    'context_id', 'account_id', 'credit_card_id', 'category_id', 'description', 'amount',
    'type', 'interval', 'start_date', 'end_date', 'next_occurrence_date', 'active',
])]
/**
 * Regra de lançamento recorrente (receita ou despesa fixa) — não move
 * saldo por si só, só descreve "o quê, quanto, de quanto em quanto
 * tempo". Quem materializa em `StatementEntry` é o job
 * `GenerateRecurringTransactionEntries` (ver `RegisterRecurringTransaction`).
 * Com `credit_card_id` (em vez de `account_id`) é uma assinatura no
 * cartão: cada ocorrência vira compra na fatura ({@see CardPurchase}).
 *
 * @property-read StatementEntryType $type
 * @property-read RecurrenceInterval $interval
 * @property-read Carbon $start_date
 * @property-read Carbon|null $end_date
 * @property-read Carbon $next_occurrence_date
 *
 * @package App\Models
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   21/08/2026
 *
 * @updated 23/09/2026
 */
class RecurringTransaction extends Model
{
    /** @use HasFactory<RecurringTransactionFactory> */
    use HasFactory;

    /** @return BelongsTo<Context, $this> */
    public function context(): BelongsTo
    {
        return $this->belongsTo(Context::class);
    }

    /** @return BelongsTo<Account, $this> */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /** @return BelongsTo<CreditCard, $this> */
    public function creditCard(): BelongsTo
    {
        return $this->belongsTo(CreditCard::class);
    }

    /** @return BelongsTo<Category, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /** @return HasMany<StatementEntry, $this> */
    public function entries(): HasMany
    {
        return $this->hasMany(StatementEntry::class);
    }

    /**
     * Se a regra é de cartão de crédito (assinatura) — as ocorrências
     * viram {@see CardPurchase}, não {@see StatementEntry}.
     */
    public function isCreditCard(): bool
    {
        return $this->credit_card_id !== null;
    }

    /** Se esta regra não tem data-fim — "despesa fixa" na tela. */
    public function isFixed(): bool
    {
        return $this->end_date === null;
    }

    /**
     * Converte atributos para tipos de domínio.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => StatementEntryType::class,
            'interval' => RecurrenceInterval::class,
            'start_date' => 'date',
            'end_date' => 'date',
            'next_occurrence_date' => 'date',
            'active' => 'boolean',
        ];
    }
}
