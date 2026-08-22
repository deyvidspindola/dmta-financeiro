<?php

declare(strict_types=1);

namespace App\Enums;

use App\Models\Debt;

/**
 * Situação de uma {@see Debt}. Não existe "vencida" automática como em
 * {@see BillStatus} — dívida registrada é ciência de compromisso, não
 * cobrança com vencimento obrigatório (ver docblock de {@see Debt}).
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
enum DebtStatus: string
{
    case Pending = 'pending';
    case Settled = 'settled';
}
