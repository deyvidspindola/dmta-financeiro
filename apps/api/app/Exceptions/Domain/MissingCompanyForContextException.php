<?php

declare(strict_types=1);

namespace App\Exceptions\Domain;

use InvalidArgumentException;

/**
 * Lançada ao tentar criar um contexto `company` sem informar a empresa.
 *
 * @package App\Exceptions\Domain
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final class MissingCompanyForContextException extends InvalidArgumentException
{
    public function __construct()
    {
        parent::__construct('Um contexto do tipo empresa exige uma empresa vinculada.');
    }
}
