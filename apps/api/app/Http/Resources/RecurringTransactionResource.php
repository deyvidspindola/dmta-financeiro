<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\RecurringTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Formato de saída de uma {@see RecurringTransaction}.
 *
 * @mixin RecurringTransaction
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
final class RecurringTransactionResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'account_id' => $this->account_id,
            'category_id' => $this->category_id,
            'description' => $this->description,
            'amount' => (float) $this->amount,
            // @phpstan-ignore-next-line property.nonObject (cast StatementEntryType da migration)
            'type' => $this->type->value,
            // @phpstan-ignore-next-line property.nonObject (cast RecurrenceInterval da migration)
            'interval' => $this->interval->value,
            // @phpstan-ignore-next-line method.nonObject (cast 'date' da migration)
            'start_date' => $this->start_date->toDateString(),
            // @phpstan-ignore-next-line method.nonObject (cast 'date' da migration)
            'end_date' => $this->end_date?->toDateString(),
            // @phpstan-ignore-next-line method.nonObject (cast 'date' da migration)
            'next_occurrence_date' => $this->next_occurrence_date->toDateString(),
            'is_fixed' => $this->isFixed(),
            'active' => (bool) $this->active,
        ];
    }
}
