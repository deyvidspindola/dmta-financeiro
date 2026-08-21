<?php

declare(strict_types=1);

namespace App\Exceptions\Domain;

/**
 * Lançada quando a categoria-mãe informada não pertence ao mesmo contexto
 * da subcategoria sendo criada — categoria nunca atravessa contexto.
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
final class CategoryParentMismatchException extends DomainException
{
    public function __construct()
    {
        parent::__construct('A categoria-mãe precisa pertencer ao mesmo contexto.');
    }
}
