<?php

declare(strict_types=1);

namespace App\Exceptions\Domain;

/**
 * Lançada quando uma conta informada (origem, destino ou de um lançamento
 * movido) não pertence ao contexto esperado — conta nunca atravessa
 * contexto sem passar pelo fluxo explícito de mover cadastro.
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
final class AccountContextMismatchException extends DomainException
{
    public function __construct()
    {
        parent::__construct('A conta informada não pertence ao contexto esperado.');
    }
}
