<?php

declare(strict_types=1);

namespace App\UseCases\Account;

use App\DTOs\UpdateAccountData;
use App\Models\Account;

/**
 * Atualiza o cadastro de uma conta (nome, tipo, instituição). Saldo não
 * é editável aqui — ver docblock de {@see UpdateAccountData}.
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
final class UpdateAccount
{
    public function execute(Account $account, UpdateAccountData $data): Account
    {
        $account->update([
            'name' => $data->name,
            'type' => $data->type->value,
            'institution' => $data->institution,
            'include_in_dashboard' => $data->includeInDashboard,
            'color' => $data->color,
        ]);

        return $account;
    }
}
