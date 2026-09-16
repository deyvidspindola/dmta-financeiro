<?php

declare(strict_types=1);

namespace App\DTOs;

use App\Enums\AccountType;
use App\UseCases\Account\RegisterAccount;

/**
 * Entrada do caso de uso {@see RegisterAccount}.
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
final readonly class RegisterAccountData
{
    public function __construct(
        public int $contextId,
        public string $name,
        public ?string $institution,
        public float $initialBalance,
        public AccountType $type = AccountType::Checking,
        public bool $includeInDashboard = true,
    ) {}
}
