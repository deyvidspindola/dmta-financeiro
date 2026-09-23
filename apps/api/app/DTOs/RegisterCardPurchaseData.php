<?php

declare(strict_types=1);

namespace App\DTOs;

use App\UseCases\CreditCard\RegisterCardPurchase;

/**
 * Entrada do caso de uso {@see RegisterCardPurchase}. `installments`
 * maior que 1 divide a compra em N parcelas — uma por fatura de mês
 * consecutivo, ligadas pelo mesmo `installment_group`.
 *
 * @package App\DTOs
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   01/09/2026
 *
 * @updated 23/09/2026
 */
final readonly class RegisterCardPurchaseData
{
    public function __construct(
        public int $contextId,
        public int $creditCardId,
        public string $description,
        public float $amount,
        public string $occurredAt,
        public ?int $categoryId = null,
        public int $installments = 1,
        public ?int $recurringTransactionId = null,
    ) {}
}
