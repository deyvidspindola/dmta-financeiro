<?php

declare(strict_types=1);

namespace App\Enums;

use App\Models\StatementEntry;

/**
 * Natureza de um {@see StatementEntry} — decide o sinal do
 * impacto no saldo da conta (receita soma, despesa e transferência de
 * saída subtraem).
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
enum StatementEntryType: string
{
    case Income = 'income';
    case Expense = 'expense';
    case Transfer = 'transfer';
}
