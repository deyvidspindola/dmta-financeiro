<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\DebtStatus;
use App\UseCases\Debt\SettleDebt;
use Database\Factories\DebtFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

#[Fillable([
    'context_id', 'description', 'counterparty', 'amount', 'direction',
    'status', 'due_date', 'notes', 'settled_at',
])]
/**
 * Dívida pendente de registro (empréstimo entre pessoas, parcelamento
 * informal, compromisso fora do fluxo normal de boleto/cartão). Existe
 * só pra dar ciência do compromisso — nunca move saldo de conta e nunca
 * entra no balanço mensal (`month_income`/`month_expense` do
 * dashboard). Quitar uma dívida é decisão manual do usuário
 * ({@see SettleDebt}); se ela também deve mover
 * saldo de fato, isso é um lançamento à parte, registrado como
 * `StatementEntry` normal — as duas coisas não são fundidas de
 * propósito.
 *
 * @property-read Carbon|null $due_date
 * @property-read Carbon|null $settled_at
 *
 * @package App\Models
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   22/08/2026
 *
 * @updated 22/08/2026
 */
class Debt extends Model
{
    /** @use HasFactory<DebtFactory> */
    use HasFactory;

    /** @return BelongsTo<Context, $this> */
    public function context(): BelongsTo
    {
        return $this->belongsTo(Context::class);
    }

    /** Se a dívida já foi quitada. */
    public function isSettled(): bool
    {
        return $this->status === DebtStatus::Settled->value;
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
            'settled_at' => 'datetime',
            'amount' => 'decimal:2',
        ];
    }
}
