<?php

declare(strict_types=1);

namespace App\Models;

use App\Services\BudgetProgressService;
use Database\Factories\BudgetFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

#[Fillable(['context_id', 'category_id', 'limit_amount', 'month'])]
/**
 * Teto de gasto de uma categoria. `month` nulo = teto padrão de todo mês;
 * preenchido = override daquele mês. O progresso (quanto já gastou) é
 * calculado sob demanda por {@see BudgetProgressService}, nunca guardado.
 *
 * @property-read Carbon|null $month
 *
 * @package App\Models
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   02/09/2026
 *
 * @updated 02/09/2026
 */
class Budget extends Model
{
    /** @use HasFactory<BudgetFactory> */
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

    /** Se este é o teto padrão da categoria (vale todo mês), não um override pontual. */
    public function isDefault(): bool
    {
        return $this->month === null;
    }

    /**
     * Converte atributos para tipos de domínio.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'month' => 'date',
            'limit_amount' => 'decimal:2',
        ];
    }
}
