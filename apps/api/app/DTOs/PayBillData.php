<?php

declare(strict_types=1);

namespace App\DTOs;

use App\UseCases\Bill\PayBill;

/**
 * Entrada do caso de uso {@see PayBill}.
 *
 * @package App\DTOs
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   22/08/2026
 *
 * @updated 22/08/2026
 */
final readonly class PayBillData
{
    public function __construct(
        public int $accountId,
        public ?string $occurredAt = null,
    ) {}
}
