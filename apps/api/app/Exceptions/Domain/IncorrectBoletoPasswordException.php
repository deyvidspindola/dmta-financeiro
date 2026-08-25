<?php

declare(strict_types=1);

namespace App\Exceptions\Domain;

/**
 * Lançada quando a senha informada manualmente pra desbloquear um boleto
 * (`POST bill-captures/{capture}/unlock`) não autentica contra o PDF
 * (senha errada, ou o PDF não é o mesmo arquivo original) — ver DT-07.
 *
 * @package App\Exceptions\Domain
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   23/08/2026
 *
 * @updated 23/08/2026
 */
final class IncorrectBoletoPasswordException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Senha incorreta — não foi possível abrir o PDF do boleto com ela.');
    }
}
