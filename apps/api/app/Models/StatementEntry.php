<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\StatementEntryStatus;
use App\Enums\StatementEntryType;
use App\Enums\TransferRole;
use App\Models\Concerns\AppliesTransactionFilters;
use App\UseCases\Transaction\TransferBetweenAccounts;
use Database\Factories\StatementEntryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

#[Fillable([
    'context_id', 'account_id', 'category_id', 'bill_id', 'card_invoice_id',
    'transfer_pair_id', 'transfer_role', 'recurring_transaction_id', 'goal_id',
    'description', 'amount', 'type', 'status', 'settled_at', 'occurred_at', 'origin',
])]
/**
 * Lançamento numa conta — o registro que move `accounts.balance` (ver
 * {@see RegisterTransaction}). `amount` sempre positivo, o sinal vem de
 * `type`. Pode nascer `pending` (previsto) e só mover o saldo quando
 * efetivado — ver {@see StatementEntryStatus} e {@see SettleTransaction}.
 *
 * @property-read StatementEntryType $type
 * @property-read StatementEntryStatus $status
 * @property-read Carbon $occurred_at
 *
 * @package App\Models
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 */
class StatementEntry extends Model
{
    use AppliesTransactionFilters;

    /** @use HasFactory<StatementEntryFactory> */
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

    /** @return BelongsTo<Category, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /** @return BelongsTo<Bill, $this> */
    public function bill(): BelongsTo
    {
        return $this->belongsTo(Bill::class);
    }

    /** Meta pra qual este lançamento conta como aporte, quando marcado (capítulo 9.7). */
    public function goal(): BelongsTo
    {
        return $this->belongsTo(Goal::class);
    }

    /** A outra perna desta transferência (débito ⇄ crédito) — ver {@see TransferBetweenAccounts}. */
    public function transferPair(): BelongsTo
    {
        return $this->belongsTo(self::class, 'transfer_pair_id');
    }

    /**
     * Se esta é a perna de origem (débito) de uma transferência, não a de
     * destino (crédito). Lê `transfer_role`; o fallback pela ordem de `id`
     * só cobre um estado meio-migrado. Só chame com `transfer_pair_id !== null`.
     */
    public function isTransferOrigin(): bool
    {
        if ($this->transfer_role !== null) {
            // @phpstan-ignore-next-line identical.alwaysFalse (cast TransferRole confirmado em runtime — larastan erra a inferência de casts())
            return $this->transfer_role === TransferRole::Origin;
        }

        return $this->id < $this->transfer_pair_id;
    }

    /** @return BelongsTo<RecurringTransaction, $this> */
    public function recurringTransaction(): BelongsTo
    {
        return $this->belongsTo(RecurringTransaction::class);
    }

    /**
     * `->settled()` = só os efetivados (moveram o saldo); `->pending()` =
     * só os previstos. Ver {@see StatementEntryStatus}.
     *
     * @param  Builder<StatementEntry>  $query
     * @return Builder<StatementEntry>
     */
    public function scopeSettled(Builder $query): Builder
    {
        return $query->where('status', StatementEntryStatus::Settled->value);
    }

    /**
     * @param  Builder<StatementEntry>  $query
     * @return Builder<StatementEntry>
     */
    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', StatementEntryStatus::Pending->value);
    }

    /** `true` se o lançamento já foi efetivado (moveu o saldo da conta). */
    public function isSettled(): bool
    {
        // @phpstan-ignore-next-line identical.alwaysFalse (cast StatementEntryStatus confirmado em runtime — larastan erra a inferência de casts())
        return $this->status === StatementEntryStatus::Settled;
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'occurred_at' => 'date',
            'settled_at' => 'datetime',
            'amount' => 'decimal:2',
            'type' => StatementEntryType::class,
            'status' => StatementEntryStatus::class,
            'transfer_role' => TransferRole::class,
        ];
    }
}
