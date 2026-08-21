<?php

declare(strict_types=1);

namespace App\Enums;

use App\Models\Context;

/**
 * Tipo de um {@see Context}: pessoa física ou empresa (D-03).
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
enum ContextType: string
{
    case Pf = 'pf';
    case Company = 'company';
}
