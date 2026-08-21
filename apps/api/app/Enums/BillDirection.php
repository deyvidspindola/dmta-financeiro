<?php

declare(strict_types=1);

namespace App\Enums;

use App\Models\Bill;

/**
 * Sentido de um {@see Bill}: a pagar ou a receber.
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
enum BillDirection: string
{
    case Payable = 'payable';
    case Receivable = 'receivable';
}
