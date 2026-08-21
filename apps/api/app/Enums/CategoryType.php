<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Separa categoria de despesa de categoria de receita. Lançamento do tipo
 * `transfer` ({@see StatementEntryType}) não usa categoria — só `income` e
 * `expense` têm contrapartida aqui.
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
enum CategoryType: string
{
    case Expense = 'expense';
    case Income = 'income';
}
