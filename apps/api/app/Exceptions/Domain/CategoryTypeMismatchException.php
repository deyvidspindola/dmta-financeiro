<?php

declare(strict_types=1);

namespace App\Exceptions\Domain;

/**
 * Lançada quando o tipo informado para uma subcategoria diverge do tipo da
 * categoria-mãe — uma subcategoria de despesa não pode virar receita, e
 * vice-versa.
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
final class CategoryTypeMismatchException extends DomainException
{
    public function __construct()
    {
        parent::__construct('A subcategoria precisa ter o mesmo tipo (despesa/receita) da categoria-mãe.');
    }
}
