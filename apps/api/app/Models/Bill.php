<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\BillStatus;
use Database\Factories\BillFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'context_id', 'category_id', 'description', 'amount', 'due_date',
    'direction', 'status', 'origin', 'barcode', 'beneficiary', 'paid_at',
])]
/**
 * Boleto a pagar/receber (D-06). Não move saldo de conta sozinho — quando
 * confirmado, o caso de uso que processa o pagamento cria um
 * {@see StatementEntry} vinculado.
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
class Bill extends Model
{
    /** @use HasFactory<BillFactory> */
    use HasFactory;

    /** @return BelongsTo<Context, $this> */
    public function context(): BelongsTo
    {
        return $this->belongsTo(Context::class);
    }

    /** @return BelongsTo<Category, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /** @return HasOne<StatementEntry, $this> */
    public function statementEntry(): HasOne
    {
        return $this->hasOne(StatementEntry::class);
    }

    /** Se o vencimento já passou e o boleto ainda não foi pago/cancelado. */
    public function isOverdue(): bool
    {
        return $this->status === BillStatus::Pending->value
            && $this->due_date->isPast();
    }

    /**
     * Converte atributos para tipos de domínio.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'paid_at' => 'datetime',
            'amount' => 'decimal:2',
        ];
    }
}
