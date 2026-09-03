<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\CardInvoice;
use App\Models\CreditCard;

/**
 * Recalcula o `total_amount` (coluna materializada) das faturas de um
 * cartão a partir da soma real das compras — rede de segurança contra
 * qualquer descompasso entre o total exibido e as compras da fatura
 * (ex.: importação parcial, exclusão manual antiga).
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   03/09/2026
 *
 * @updated 03/09/2026
 */
final class ReconcileCardInvoiceTotals
{
    public function forCard(CreditCard $card): void
    {
        $card->invoices()->get()->each(function (CardInvoice $invoice): void {
            $real = (float) $invoice->purchases()->sum('amount');

            if ((float) $invoice->total_amount !== $real) {
                $invoice->forceFill(['total_amount' => $real])->save();
            }
        });
    }
}
