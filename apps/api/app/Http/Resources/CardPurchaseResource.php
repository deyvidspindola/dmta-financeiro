<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\CardPurchase;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Formato de saída de uma {@see CardPurchase}.
 *
 * @mixin CardPurchase
 *
 * @package App\Http\Resources
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   01/09/2026
 *
 * @updated 01/09/2026
 */
final class CardPurchaseResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'credit_card_id' => $this->credit_card_id,
            'card_invoice_id' => $this->card_invoice_id,
            'category_id' => $this->category_id,
            'description' => $this->description,
            'amount' => (float) $this->amount,
            // @phpstan-ignore-next-line method.nonObject (cast 'date' da migration)
            'occurred_at' => $this->occurred_at->toDateString(),
            'installment_number' => $this->installment_number,
            'installment_total' => $this->installment_total,
        ];
    }
}
