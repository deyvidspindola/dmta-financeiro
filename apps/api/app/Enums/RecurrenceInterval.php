<?php

declare(strict_types=1);

namespace App\Enums;

use App\Models\RecurringTransaction;
use Illuminate\Support\Carbon;

/**
 * Frequência de uma {@see RecurringTransaction}.
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
enum RecurrenceInterval: string
{
    case Weekly = 'weekly';
    case Monthly = 'monthly';
    case Yearly = 'yearly';

    /** Próxima data a partir de `$from`, de acordo com a frequência. */
    public function nextAfter(Carbon $from): Carbon
    {
        return match ($this) {
            self::Weekly => $from->copy()->addWeek(),
            self::Monthly => $from->copy()->addMonthNoOverflow(),
            self::Yearly => $from->copy()->addYearNoOverflow(),
        };
    }
}
