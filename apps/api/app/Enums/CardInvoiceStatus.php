<?php

declare(strict_types=1);

namespace App\Enums;

use App\Models\CardInvoice;

/**
 * Situação de uma {@see CardInvoice}.
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
enum CardInvoiceStatus: string
{
    case Open = 'open';
    case Closed = 'closed';
    case Paid = 'paid';
}
