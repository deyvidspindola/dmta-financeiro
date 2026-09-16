<?php

declare(strict_types=1);

namespace App\Exceptions\Domain;

/**
 * Lançada quando a categoria de uma perna de transferência entre
 * contextos (D-20) não existe, é de outro contexto, ou tem o tipo
 * errado (origem precisa ser categoria de despesa, destino de receita).
 *
 * @package App\Exceptions\Domain
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   16/09/2026
 *
 * @updated 16/09/2026
 */
final class TransferCategoryMismatchException extends DomainException
{
    public function __construct()
    {
        parent::__construct('A categoria da transferência precisa ser do contexto certo e do tipo certo (despesa na origem, receita no destino).');
    }
}
