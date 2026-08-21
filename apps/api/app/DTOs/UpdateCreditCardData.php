<?php

declare(strict_types=1);

namespace App\DTOs;

use App\UseCases\CreditCard\UpdateCreditCard;

/**
 * Entrada do caso de uso {@see UpdateCreditCard}.
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
final readonly class UpdateCreditCardData
{
    public function __construct(
        public string $name,
        public int $closingDay,
        public int $dueDay,
        public ?string $brand = null,
        public ?float $creditLimit = null,
    ) {}
}
