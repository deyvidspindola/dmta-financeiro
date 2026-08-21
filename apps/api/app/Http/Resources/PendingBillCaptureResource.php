<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\PendingBillCapture;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Formato de saída de uma {@see PendingBillCapture}.
 *
 * @mixin PendingBillCapture
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
final class PendingBillCaptureResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            // @phpstan-ignore-next-line property.nonObject (cast CaptureOrigin da migration)
            'origin' => $this->origin->value,
            'linha_digitavel' => $this->linha_digitavel,
            'amount' => $this->amount !== null ? (float) $this->amount : null,
            // @phpstan-ignore-next-line method.nonObject (cast 'date' da migration)
            'due_date' => $this->due_date?->toDateString(),
            'beneficiary' => $this->beneficiary,
            // @phpstan-ignore-next-line property.nonObject (cast CaptureStatus da migration)
            'status' => $this->status->value,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
