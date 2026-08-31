<?php

declare(strict_types=1);

namespace App\DTOs;

use App\UseCases\CreditCard\PayCardInvoice;

/**
 * Entrada do caso de uso {@see PayCardInvoice}.
 *
 * @package App\DTOs
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   01/09/2026
 *
 * @updated 01/09/2026
 */
final readonly class PayCardInvoiceData
{
    public function __construct(
        public int $accountId,
        public ?string $occurredAt = null,
    ) {}
}
