<?php

declare(strict_types=1);

namespace App\UseCases\CreditCard;

use App\DTOs\UpdateCreditCardData;
use App\Models\CreditCard;

/**
 * Atualiza o cadastro de um cartão. Não mexe em faturas já geradas.
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
final class UpdateCreditCard
{
    public function execute(CreditCard $creditCard, UpdateCreditCardData $data): CreditCard
    {
        $creditCard->update([
            'name' => $data->name,
            'brand' => $data->brand,
            'closing_day' => $data->closingDay,
            'due_day' => $data->dueDay,
            'credit_limit' => $data->creditLimit,
        ]);

        return $creditCard;
    }
}
