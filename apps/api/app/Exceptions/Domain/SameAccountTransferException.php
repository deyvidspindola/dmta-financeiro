<?php

declare(strict_types=1);

namespace App\Exceptions\Domain;

/**
 * Lançada ao tentar transferir de uma conta para ela mesma.
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
final class SameAccountTransferException extends DomainException
{
    public function __construct()
    {
        parent::__construct('A conta de origem e destino não podem ser a mesma.');
    }
}
