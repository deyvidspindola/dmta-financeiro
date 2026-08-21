<?php

declare(strict_types=1);

namespace App\Exceptions\Domain;

use RuntimeException;

/**
 * Base de toda exceção de regra de negócio (violação de invariante do
 * domínio, não erro de infraestrutura). `bootstrap/app.php` mapeia esta
 * classe para HTTP 422 — uma exceção nova em `app/Exceptions/Domain/`
 * só precisa estender esta para ganhar o tratamento correto na API, sem
 * cair como 500.
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
abstract class DomainException extends RuntimeException {}
