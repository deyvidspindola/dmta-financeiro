<?php

declare(strict_types=1);

namespace App\Enums;

use App\Models\Bill;

/**
 * Situação de um {@see Bill}. `Overdue` não é calculado por
 * job automático nesta fase — a leitura marca vencido quando `due_date`
 * já passou e `status` ainda é `Pending` (ver `Bill::isOverdue()`).
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
enum BillStatus: string
{
    case Pending = 'pending';
    case Paid = 'paid';
    case Overdue = 'overdue';
    case Cancelled = 'cancelled';
}
