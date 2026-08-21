<?php

declare(strict_types=1);

namespace App\Exceptions\Domain;

use RuntimeException;

/**
 * Lançada quando o usuário já tem um contexto `pf` e uma segunda tentativa
 * de criação chega — um usuário tem no máximo um contexto pessoa física.
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
final class DuplicatePfContextException extends RuntimeException
{
    public function __construct()
    {
        parent::__construct('Este usuário já tem um contexto pessoa física.');
    }
}
