<?php

declare(strict_types=1);

namespace App\DTOs;

use App\Enums\AccountType;
use App\UseCases\Account\UpdateAccount;
use App\UseCases\Transaction\RegisterTransaction;

/**
 * Entrada do caso de uso {@see UpdateAccount}.
 * Não inclui `balance`/`initialBalance` — saldo só muda por lançamento
 * (ver {@see RegisterTransaction}), nunca por
 * edição direta do cadastro.
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
final readonly class UpdateAccountData
{
    public function __construct(
        public string $name,
        public AccountType $type,
        public ?string $institution,
    ) {}
}
