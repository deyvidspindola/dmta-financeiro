<?php

declare(strict_types=1);

namespace App\UseCases\Account;

use App\DTOs\RegisterAccountData;
use App\Models\Account;
use App\UseCases\Transaction\RegisterTransaction;

/**
 * Cadastra uma conta bancária manual. `balance` nasce igual a
 * `initialBalance` — os lançamentos seguintes é que o movem
 * (ver {@see RegisterTransaction}).
 *
 * @package App\UseCases\Account
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final class RegisterAccount
{
    public function execute(RegisterAccountData $data): Account
    {
        return Account::create([
            'context_id' => $data->contextId,
            'name' => $data->name,
            'type' => $data->type->value,
            'institution' => $data->institution,
            'initial_balance' => $data->initialBalance,
            'balance' => $data->initialBalance,
        ]);
    }
}
