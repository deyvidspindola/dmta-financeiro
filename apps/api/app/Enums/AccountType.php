<?php

declare(strict_types=1);

namespace App\Enums;

use App\Models\Account;

/**
 * Tipo de uma {@see Account} — só rótulo/ícone na tela, não
 * muda nenhuma regra de negócio (movimentação é igual pra todas).
 *
 * @package App\Enums
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
enum AccountType: string
{
    case Checking = 'checking';
    case Savings = 'savings';
    case Wallet = 'wallet';
    case Other = 'other';
}
