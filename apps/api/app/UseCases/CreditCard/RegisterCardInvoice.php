<?php

declare(strict_types=1);

namespace App\UseCases\CreditCard;

use App\DTOs\RegisterCardInvoiceData;
use App\Enums\CardInvoiceStatus;
use App\Models\CardInvoice;

/**
 * Cadastra a fatura de um mês de referência para um cartão, sempre
 * `open` (F0 não fecha/paga fatura automaticamente). Detalhamento por
 * lançamento fica para uma fase seguinte — ver `docs/fases/F0_fundacao.md`.
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
