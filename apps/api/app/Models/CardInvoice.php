<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\CardInvoiceStatus;
use Database\Factories\CardInvoiceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

#[Fillable(['credit_card_id', 'reference_month', 'total_amount', 'status', 'due_date', 'paid_at'])]
/**
 * Fatura de um cartão para um mês de referência. F0 registra só o
 * resumo (valor total, status) — detalhamento por lançamento fica para
 * uma fase seguinte.
 *
 * @property-read Carbon $reference_month
 * @property-read Carbon $due_date
 * @property-read Carbon|null $paid_at
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
class CardInvoice extends Model
{
    /** @use HasFactory<CardInvoiceFactory> */
    use HasFactory;

    /** @return BelongsTo<CreditCard, $this> */
    public function creditCard(): BelongsTo
    {
        return $this->belongsTo(CreditCard::class);
    }

    /** @return HasMany<CardPurchase, $this> */
    public function purchases(): HasMany
    {
        return $this->hasMany(CardPurchase::class);
    }

    /** Se a fatura já foi paga. */
    public function isPaid(): bool
    {
        // @phpstan-ignore-next-line identical.alwaysFalse (cast CardInvoiceStatus confirmado em runtime — larastan erra os dois lados dessa inferência)
        return $this->status === CardInvoiceStatus::Paid;
    }

    /**
     * Converte atributos para tipos de domínio.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'reference_month' => 'date',
            'due_date' => 'date',
            'paid_at' => 'datetime',
            'total_amount' => 'decimal:2',
            'status' => CardInvoiceStatus::class,
        ];
    }
}
