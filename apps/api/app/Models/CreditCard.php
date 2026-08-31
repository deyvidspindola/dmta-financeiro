<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\CreditCardFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['context_id', 'name', 'brand', 'closing_day', 'due_day', 'credit_limit'])]
/**
 * Cartão de crédito de cadastro manual (capítulo 08 do documento de
 * concepção). Gera {@see CardInvoice} por mês de referência.
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
class CreditCard extends Model
{
    /** @use HasFactory<CreditCardFactory> */
    use HasFactory;

    /** @return BelongsTo<Context, $this> */
    public function context(): BelongsTo
    {
        return $this->belongsTo(Context::class);
    }

    /** @return HasMany<CardInvoice, $this> */
    public function invoices(): HasMany
    {
        return $this->hasMany(CardInvoice::class);
    }

    /** @return HasMany<CardPurchase, $this> */
    public function purchases(): HasMany
    {
        return $this->hasMany(CardPurchase::class);
    }

    /**
     * Converte atributos para tipos de domínio.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'credit_limit' => 'decimal:2',
        ];
    }
}
