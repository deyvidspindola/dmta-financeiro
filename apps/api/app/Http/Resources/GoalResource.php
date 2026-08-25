<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Goal;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Formato de saída de uma {@see Goal}.
 *
 * @mixin Goal
 *
 * @package App\Http\Resources
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   25/08/2026
 *
 * @updated 25/08/2026
 */
final class GoalResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        /** @var Goal $goal */
        $goal = $this->resource;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'target_amount' => (float) $this->target_amount,
            'current_amount' => (float) $this->current_amount,
            'percent_complete' => $goal->percentComplete(),
            // @phpstan-ignore-next-line method.nonObject (cast 'date' da migration)
            'target_date' => $this->target_date?->toDateString(),
            // @phpstan-ignore-next-line property.nonObject (cast GoalStatus da migration)
            'status' => $this->status->value,
            'notes' => $this->notes,
        ];
    }
}
