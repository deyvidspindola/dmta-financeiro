<?php

declare(strict_types=1);

namespace App\UseCases\CreditCard;

use App\DTOs\RegisterCreditCardData;
use App\Models\CardInvoice;
use App\Models\CreditCard;

/**
 * Cadastra um cartão de crédito manual (capítulo 08 do documento de
 * concepção). Não gera fatura — {@see CardInvoice} é cadastrada
 * à parte, um caso de uso por vez ainda não existe para isso na F0.
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
final class RegisterCreditCard
{
    public function execute(RegisterCreditCardData $data): CreditCard
    {
        return CreditCard::create([
            'context_id' => $data->contextId,
            'name' => $data->name,
            'brand' => $data->brand,
            'closing_day' => $data->closingDay,
            'due_day' => $data->dueDay,
            'credit_limit' => $data->creditLimit,
        ]);
    }
}
