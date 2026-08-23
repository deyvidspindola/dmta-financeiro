<?php

declare(strict_types=1);

namespace App\Enums;

use App\Models\PendingBillCapture;

/**
 * Situação de uma {@see PendingBillCapture}.
 *
 * @package App\Enums
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   21/08/2026
 *
 * @updated 23/08/2026
 */
enum CaptureStatus: string
{
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case Rejected = 'rejected';

    /** PDF do boleto veio com senha e nenhuma candidata (ou nenhuma cadastrada) abriu — aguarda senha manual (DT-07). */
    case PasswordRequired = 'password_required';
}
