<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\BillStatus;
use Database\Factories\BillFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

#[Fillable([
    'context_id', 'category_id', 'recurring_bill_id', 'description', 'amount', 'due_date',
    'direction', 'status', 'origin', 'barcode', 'beneficiary', 'paid_at',
])]
/**
 * Boleto a pagar/receber (D-06). Não move saldo de conta sozinho — quando
 * confirmado, o caso de uso que processa o pagamento cria um
 * {@see StatementEntry} vinculado.
 *
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

    /**
     * Regra de obrigação recorrente que gerou este boleto, se veio de uma.
     *
     * @return BelongsTo<RecurringBill, $this>
     */
    public function recurringBill(): BelongsTo
    {
        return $this->belongsTo(RecurringBill::class);
    }

    /** @return HasOne<StatementEntry, $this> */
    public function statementEntry(): HasOne
    {
        return $this->hasOne(StatementEntry::class);
    }

    /**
     * Filtros opcionais de `GET /bills`, já validados na camada HTTP
     * (`IndexBillRequest`): `from`/`to` (`due_date`), `status`
     * (`overdue` = pendente e vencido, sem linha própria no banco),
     * `direction`, `category_id`, `q` (descrição). Chave ausente não
     * filtra; não pagina nem ordena.
     *
     * @param  Builder<Bill>  $query
     * @param  array<string, mixed>  $filters
     * @return Builder<Bill>
     */
    public function scopeApplyFilters(Builder $query, array $filters): Builder
    {
        return $query
            ->when($filters['from'] ?? null, fn (Builder $q, $v) => $q->whereDate('due_date', '>=', $v))
            ->when($filters['to'] ?? null, fn (Builder $q, $v) => $q->whereDate('due_date', '<=', $v))
            ->when($filters['direction'] ?? null, fn (Builder $q, $v) => $q->where('direction', $v))
            ->when($filters['category_id'] ?? null, fn (Builder $q, $v) => $q->where('category_id', (int) $v))
            ->when($filters['q'] ?? null, fn (Builder $q, $v) => $q->whereLike('description', '%'.$v.'%'))
            ->when($filters['status'] ?? null, fn (Builder $q, $v) => $v === 'overdue'
                ? $q->where('status', BillStatus::Pending->value)->whereDate('due_date', '<', Carbon::today())
                : $q->where('status', $v));
    }

    /** Se o vencimento já passou e o boleto ainda não foi pago/cancelado. */
    public function isOverdue(): bool
    {
        $isPending = $this->status === BillStatus::Pending->value;

        // @phpstan-ignore-next-line method.nonObject (cast 'date' da migration — larastan não infere casts() aqui)
        return $isPending && $this->due_date->isPast();
    }

    /**
     * Dias até o vencimento (negativo se já venceu). Base do "lembrete"
     * pedido pelo motor de obrigações recorrentes — sem canal de
     * notificação nesta fase (D-11), só indicador visual na tela.
     */
    public function daysUntilDue(): int
    {
        return (int) Carbon::today()->diffInDays($this->due_date, false);
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
