<?php

declare(strict_types=1);

namespace App\DTOs;

use App\UseCases\Debt\SettleDebt;

/**
 * Entrada do caso de uso {@see SettleDebt}. `accountId` nulo = só marca a
 * dívida como quitada (comportamento padrão, D-15). `accountId`
 * preenchido = a quitação também move saldo: o caso de uso cria um
 * lançamento (despesa se `i_owe`, receita se `owed_to_me`) na conta.
 *
 * @package App\DTOs
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   31/08/2026
 *
 * @updated 31/08/2026
 */
final readonly class SettleDebtData
{
    public function __construct(
        public ?int $accountId = null,
        public ?string $occurredAt = null,
    ) {}
}
