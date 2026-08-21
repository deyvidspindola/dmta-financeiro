<?php

declare(strict_types=1);

namespace App\Exceptions\Domain;

use App\UseCases\Transaction\MoveTransactionToContext;

/**
 * Lançada quando a categoria informada não pertence ao contexto de
 * destino de um lançamento sendo movido — ver
 * {@see MoveTransactionToContext}.
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
final class CategoryContextMismatchException extends DomainException
{
    public function __construct()
    {
        parent::__construct('A categoria informada não pertence ao contexto de destino.');
    }
}
