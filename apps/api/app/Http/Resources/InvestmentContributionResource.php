<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\InvestmentContribution;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Formato de saída de uma {@see InvestmentContribution}.
 *
 * @mixin InvestmentContribution
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
final class InvestmentContributionResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'amount' => (float) $this->amount,
            // @phpstan-ignore-next-line method.nonObject (cast 'date' da migration)
            'occurred_at' => $this->occurred_at->toDateString(),
            'note' => $this->note,
        ];
    }
}
