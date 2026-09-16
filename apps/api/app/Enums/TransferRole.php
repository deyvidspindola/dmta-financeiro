<?php

declare(strict_types=1);

namespace App\Enums;

use App\Models\StatementEntry;
use App\UseCases\Transaction\TransferBetweenAccounts;

/**
 * Qual perna de uma transferência um {@see StatementEntry} representa —
 * `Origin` é o débito (sai da conta de origem), `Destination` é o crédito
 * (entra na de destino). Preenchido em toda perna de transferência,
 * mesmo quando `type` não é `transfer` — transferência entre contextos
 * diferentes vira `expense`/`income` de verdade (D-20), mas continua
 * marcada aqui. Ver {@see TransferBetweenAccounts}.
 *
 * @package App\Enums
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   31/08/2026
 *
 * @updated 16/09/2026
 */
enum TransferRole: string
{
    case Origin = 'origin';
    case Destination = 'destination';
}
