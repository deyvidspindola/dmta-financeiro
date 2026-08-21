<?php

declare(strict_types=1);

namespace App\Exceptions\Domain;

/**
 * Lançada ao tentar confirmar/rejeitar uma pendência de captura que já
 * foi confirmada ou rejeitada antes — evita duplicar `Bill` clicando
 * confirmar duas vezes (ex.: duplo clique, aba duplicada).
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
final class CaptureAlreadyProcessedException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Esta pendência já foi confirmada ou rejeitada.');
    }
}
