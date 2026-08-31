<?php

declare(strict_types=1);

namespace App\Enums;

use App\Models\StatementEntry;
use App\UseCases\Transaction\TransferBetweenAccounts;

/**
 * Qual perna de uma transferência um {@see StatementEntry} representa —
 * `Origin` é o débito (sai da conta de origem), `Destination` é o crédito
 * (entra na de destino). Só lançamento com `type = transfer` tem isto
 * preenchido; ver {@see TransferBetweenAccounts}.
 *
 * @package App\Enums
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   31/08/2026
 *
 * @updated 31/08/2026
 */
enum TransferRole: string
{
    case Origin = 'origin';
    case Destination = 'destination';
}
