<?php

declare(strict_types=1);

namespace App\Enums;

use App\Models\Debt;

/**
 * Sentido de uma {@see Debt}: dinheiro que eu devo, ou que me devem.
 *
 * @package App\Enums
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   22/08/2026
 *
 * @updated 22/08/2026
 */
enum DebtDirection: string
{
    case IOwe = 'i_owe';
    case OwedToMe = 'owed_to_me';
}
