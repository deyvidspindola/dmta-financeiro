<?php

declare(strict_types=1);

namespace App\Models;

use App\Domain\CreditCard\InvoiceAllocator;
use Database\Factories\CardPurchaseFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

#[Fillable([
    'context_id', 'credit_card_id', 'card_invoice_id', 'category_id',
    'description', 'amount', 'occurred_at',
    'installment_number', 'installment_total', 'installment_group',
])]
/**
 * Compra num cartão de crédito, alocada numa {@see CardInvoice} pelo dia
 * de fechamento ({@see InvoiceAllocator}). NÃO move `accounts.balance` —
 * isso é só o pagamento da fatura ({@see StatementEntry}). Compra
 * parcelada vira N linhas, uma por fatura, com o mesmo
 * `installment_group`.
 *
 * @property-read Carbon $occurred_at
 *
 * @package App\Models
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   01/09/2026
 *
 * @updated 01/09/2026
 */
class CardPurchase extends Model
{
    /** @use HasFactory<CardPurchaseFactory> */
    use HasFactory;

    /** @return BelongsTo<Context, $this> */
    public function context(): BelongsTo
    {
        return $this->belongsTo(Context::class);
    }

    /** @return BelongsTo<CreditCard, $this> */
    public function creditCard(): BelongsTo
    {
        return $this->belongsTo(CreditCard::class);
    }

    /** @return BelongsTo<CardInvoice, $this> */
    public function cardInvoice(): BelongsTo
    {
        return $this->belongsTo(CardInvoice::class);
    }

    /** @return BelongsTo<Category, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
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
        ];
    }
}
