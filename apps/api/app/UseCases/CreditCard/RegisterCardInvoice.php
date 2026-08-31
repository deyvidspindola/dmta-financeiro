<?php

declare(strict_types=1);

namespace App\UseCases\CreditCard;

use App\DTOs\RegisterCardInvoiceData;
use App\Enums\CardInvoiceStatus;
use App\Jobs\CloseCardInvoices;
use App\Models\CardInvoice;

/**
 * Cadastra manualmente a fatura de um mês de referência, sempre `open`.
 *
 * @deprecated desde a fase A2 (D-16). O fluxo normal é lançar compras
 * ({@see RegisterCardPurchase}), que criam a fatura sozinhas, e fechar
 * pelo job ({@see CloseCardInvoices}). Este caso de uso fica só
 * para migração de saldo inicial / fatura pré-existente.
 *
 * @package App\UseCases\CreditCard
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final class RegisterCardInvoice
{
    public function execute(RegisterCardInvoiceData $data): CardInvoice
    {
        return CardInvoice::create([
            'credit_card_id' => $data->creditCardId,
            'reference_month' => $data->referenceMonth,
            'total_amount' => $data->totalAmount,
            'status' => CardInvoiceStatus::Open->value,
            'due_date' => $data->dueDate,
        ]);
    }
}
