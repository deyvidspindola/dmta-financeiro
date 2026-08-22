<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\BillDirection;
use App\Enums\RecurrenceInterval;
use Database\Factories\RecurringBillFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

#[Fillable([
    'context_id', 'category_id', 'description', 'amount', 'direction',
    'interval', 'start_date', 'end_date', 'next_due_date',
    'reminder_days_before', 'active',
])]
/**
 * Regra de obrigação recorrente (DARF/DAS e afins, capítulo 07) — não
 * cria {@see Bill} por si só, só descreve "o quê, quanto, de quanto em
 * quanto tempo". Quem materializa em `Bill` é o job
 * `GenerateRecurringBillEntries` (ver `RegisterRecurringBill`).
 *
 * @property-read BillDirection $direction
 * @property-read RecurrenceInterval $interval
 * @property-read Carbon $start_date
 * @property-read Carbon|null $end_date
 * @property-read Carbon $next_due_date
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
class RecurringBill extends Model
{
    /** @use HasFactory<RecurringBillFactory> */
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

    /** Se esta regra não tem data-fim. */
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
            'direction' => BillDirection::class,
            'interval' => RecurrenceInterval::class,
            'start_date' => 'date',
            'end_date' => 'date',
            'next_due_date' => 'date',
            'reminder_days_before' => 'integer',
            'active' => 'boolean',
        ];
    }
}
