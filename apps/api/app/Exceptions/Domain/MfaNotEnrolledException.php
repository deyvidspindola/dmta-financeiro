<?php

declare(strict_types=1);

namespace App\Exceptions\Domain;

/**
 * Lançada ao tentar confirmar o MFA sem ter chamado o enroll antes —
 * não existe secret pendente pra confirmar.
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
final class MfaNotEnrolledException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Nenhum MFA pendente de confirmação — chame o enroll primeiro.');
    }
}
