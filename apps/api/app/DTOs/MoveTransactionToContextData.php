<?php

declare(strict_types=1);

namespace App\DTOs;

use App\UseCases\Transaction\MoveTransactionToContext;

/**
 * Entrada do caso de uso {@see MoveTransactionToContext}.
 *
 * @package App\DTOs
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final readonly class MoveTransactionToContextData
{
    public function __construct(
        public int $targetContextId,
        public int $targetAccountId,
        public ?int $targetCategoryId = null,
    ) {}
}
