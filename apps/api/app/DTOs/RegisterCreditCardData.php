<?php

declare(strict_types=1);

namespace App\DTOs;

use App\UseCases\CreditCard\RegisterCreditCard;

/**
 * Entrada do caso de uso {@see RegisterCreditCard}.
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
final readonly class RegisterCreditCardData
{
    public function __construct(
        public int $contextId,
        public string $name,
        public int $closingDay,
        public int $dueDay,
        public ?string $brand = null,
        public ?float $creditLimit = null,
    ) {}
}
