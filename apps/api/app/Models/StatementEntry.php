<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\StatementEntryType;
use Database\Factories\StatementEntryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

#[Fillable([
    'context_id', 'account_id', 'category_id', 'bill_id', 'card_invoice_id',
    'description', 'amount', 'type', 'occurred_at', 'origin',
])]
/**
 * Lançamento efetivo numa conta — o único registro que de fato move
 * `accounts.balance` (ver `RegisterTransaction`). `amount` é sempre
 * positivo; o sinal do impacto vem de `type`.
 *
 * @property-read StatementEntryType $type
 * @property-read Carbon $occurred_at
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
class StatementEntry extends Model
{
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

    /** Sinal (+1/-1) do impacto deste lançamento no saldo da conta. */
    public function balanceSign(): int
    {
        return $this->type === StatementEntryType::Income->value ? 1 : -1;
    }

    /**
     * Converte atributos para tipos de domínio.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'occurred_at' => 'date',
            'amount' => 'decimal:2',
            'type' => StatementEntryType::class,
        ];
    }
}
