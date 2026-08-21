<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\StatementEntry;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Formato de saída de um {@see StatementEntry}.
 *
 * @mixin StatementEntry
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
final class StatementEntryResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'account_id' => $this->account_id,
            'category_id' => $this->category_id,
            'bill_id' => $this->bill_id,
            'description' => $this->description,
            'amount' => (float) $this->amount,
            // @phpstan-ignore-next-line property.nonObject (cast StatementEntryType da migration)
            'type' => $this->type->value,
            // @phpstan-ignore-next-line method.nonObject (cast 'date' da migration)
            'occurred_at' => $this->occurred_at->toDateString(),
            'origin' => $this->origin,
        ];
    }
}
