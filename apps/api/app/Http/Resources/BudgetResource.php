<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Budget;
use App\Services\BudgetProgressService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Formato de saída de um {@see Budget} (o registro cru do teto). O
 * progresso do mês vem do endpoint de listagem, montado por
 * {@see BudgetProgressService}.
 *
 * @mixin Budget
 *
 * @package App\Http\Resources
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   02/09/2026
 *
 * @updated 02/09/2026
 */
final class BudgetResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'category_id' => $this->category_id,
            'limit_amount' => (float) $this->limit_amount,
            // @phpstan-ignore-next-line method.nonObject (cast 'date' da migration)
            'month' => $this->month?->format('Y-m'),
        ];
    }
}
