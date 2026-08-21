<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\CardInvoice;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Formato de saída de uma {@see CardInvoice}.
 *
 * @mixin CardInvoice
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
final class CardInvoiceResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            // @phpstan-ignore-next-line method.nonObject (cast 'date' da migration)
            'reference_month' => $this->reference_month->format('Y-m'),
            'total_amount' => (float) $this->total_amount,
            'status' => $this->status,
            // @phpstan-ignore-next-line method.nonObject (cast 'date' da migration)
            'due_date' => $this->due_date->toDateString(),
            // @phpstan-ignore-next-line method.nonObject (cast 'datetime' da migration)
            'paid_at' => $this->paid_at?->toIso8601String(),
        ];
    }
}
