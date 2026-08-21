<?php

declare(strict_types=1);

namespace App\DTOs;

use App\Enums\ContextType;
use App\UseCases\Context\CreateContext;

/**
 * Entrada do caso de uso {@see CreateContext}.
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
final readonly class CreateContextData
{
    public function __construct(
        public int $userId,
        public ContextType $type,
        public string $name,
        public ?int $companyId = null,
    ) {}
}
