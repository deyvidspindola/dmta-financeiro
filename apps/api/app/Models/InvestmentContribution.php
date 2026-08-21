<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\InvestmentContributionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

#[Fillable(['investment_id', 'amount', 'occurred_at', 'note'])]
/**
 * Um aporte registrado manualmente para um {@see Investment}.
 *
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
class InvestmentContribution extends Model
{
    /** @use HasFactory<InvestmentContributionFactory> */
    use HasFactory;

    /** @return BelongsTo<Investment, $this> */
    public function investment(): BelongsTo
    {
        return $this->belongsTo(Investment::class);
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
