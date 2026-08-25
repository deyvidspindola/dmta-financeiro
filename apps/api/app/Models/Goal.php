<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\GoalStatus;
use App\UseCases\Goal\UpdateGoal;
use App\UseCases\Goal\UpdateGoalProgress;
use Database\Factories\GoalFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['context_id', 'name', 'target_amount', 'current_amount', 'target_date', 'status', 'notes'])]
/**
 * Meta financeira (capítulo 9.7, D-13) — reserva de emergência, capital
 * de giro, troca de equipamento. `current_amount` soma os lançamentos
 * marcados como aporte pra ela (ver {@see StatementEntry::$goal_id} e
 * {@see UpdateGoalProgress}); nunca move saldo de
 * conta por conta própria — quem move saldo é o lançamento em si.
 *
 * @property-read GoalStatus $status
 *
 * @package App\Models
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   25/08/2026
 *
 * @updated 25/08/2026
 */
class Goal extends Model
{
    /** @use HasFactory<GoalFactory> */
    use HasFactory;

    /** @return BelongsTo<Context, $this> */
    public function context(): BelongsTo
    {
        return $this->belongsTo(Context::class);
    }

    /** Lançamentos marcados como aporte a esta meta. */
    public function contributions(): HasMany
    {
        return $this->hasMany(StatementEntry::class);
    }

    /** Percentual concluído, 0–100 (nunca passa de 100 mesmo se aportar além do alvo). */
    public function percentComplete(): float
    {
        if ((float) $this->target_amount <= 0) {
            return 0.0;
        }

        return min(100.0, round((float) $this->current_amount / (float) $this->target_amount * 100, 1));
    }

    /** Se o valor já aportado atinge o alvo — usado por {@see UpdateGoalProgress} e {@see UpdateGoal} pra decidir `status`, nunca editado à mão. */
    public function isComplete(): bool
    {
        return (float) $this->current_amount >= (float) $this->target_amount;
    }

    /**
     * Converte atributos para tipos de domínio.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'target_date' => 'date',
            'target_amount' => 'decimal:2',
            'current_amount' => 'decimal:2',
            'status' => GoalStatus::class,
        ];
    }
}
