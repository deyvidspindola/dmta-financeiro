<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Bill;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Formato de saída de um {@see Bill}.
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
final class BillResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'description' => $this->description,
            'amount' => $this->amount,
            'due_date' => $this->due_date->toDateString(),
            'direction' => $this->direction,
            'status' => $this->status,
            'origin' => $this->origin,
            'category_id' => $this->category_id,
            'is_overdue' => $this->isOverdue(),
            'paid_at' => $this->paid_at?->toIso8601String(),
        ];
    }
}
