<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Debt;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Formato de saída de uma {@see Debt}.
 *
 * @mixin Debt
 *
 * @package App\Http\Resources
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   22/08/2026
 *
 * @updated 22/08/2026
 */
final class DebtResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'description' => $this->description,
            'counterparty' => $this->counterparty,
            'amount' => (float) $this->amount,
            'direction' => $this->direction,
            'status' => $this->status,
            // @phpstan-ignore-next-line method.nonObject (cast 'date' da migration — larastan não infere casts() aqui)
            'due_date' => $this->due_date?->toDateString(),
            'notes' => $this->notes,
            // @phpstan-ignore-next-line method.nonObject (cast 'datetime' da migration)
            'settled_at' => $this->settled_at?->toIso8601String(),
        ];
    }
}
