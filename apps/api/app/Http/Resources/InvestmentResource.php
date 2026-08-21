<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Investment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Formato de saída de um {@see Investment}.
 *
 * @package App\Http\Resources
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final class InvestmentResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type,
            'broker' => $this->broker,
            'initial_amount' => $this->initial_amount,
            'current_amount' => $this->current_amount,
            'acquired_at' => $this->acquired_at?->toDateString(),
        ];
    }
}
