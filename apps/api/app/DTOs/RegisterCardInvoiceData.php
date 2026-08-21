<?php

declare(strict_types=1);

namespace App\DTOs;

use App\UseCases\CreditCard\RegisterCardInvoice;

/**
 * Entrada do caso de uso {@see RegisterCardInvoice}.
 *
 * @package App\DTOs
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final readonly class RegisterCardInvoiceData
{
    public function __construct(
        public int $creditCardId,
        public string $referenceMonth,
        public float $totalAmount,
        public string $dueDate,
    ) {}
}
