<?php

declare(strict_types=1);

namespace App\Exceptions\Domain;

/**
 * Código TOTP incorreto ou expirado — tanto na confirmação do
 * enrollment quanto no segundo fator do login.
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
final class InvalidMfaCodeException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Código inválido ou expirado.');
    }
}
