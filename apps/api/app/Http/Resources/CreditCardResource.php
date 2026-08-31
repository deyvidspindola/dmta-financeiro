<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\CreditCard;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Formato de saída de um {@see CreditCard}.
 *
 * @mixin CreditCard
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
final class CreditCardResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $limit = $this->credit_limit !== null ? (float) $this->credit_limit : null;
        $unpaid = (float) ($this->unpaid_invoices_total ?? 0);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'brand' => $this->brand,
            'closing_day' => $this->closing_day,
            'due_day' => $this->due_day,
            'credit_limit' => $limit,
            // Total das faturas ainda não pagas (aberta + fechadas).
            'unpaid_invoices_total' => $unpaid,
            // Total da fatura em aberto (o "gasto do ciclo atual").
            'current_invoice_total' => (float) ($this->open_invoice_total ?? 0),
            // Limite ainda disponível — null se o cartão não tem limite cadastrado.
            'available_limit' => $limit !== null ? round($limit - $unpaid, 2) : null,
        ];
    }
}
