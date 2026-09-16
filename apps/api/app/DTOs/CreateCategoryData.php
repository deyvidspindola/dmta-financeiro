<?php

declare(strict_types=1);

namespace App\DTOs;

use App\Enums\CategoryType;
use App\UseCases\Category\CreateCategory;

/**
 * Entrada do caso de uso {@see CreateCategory}.
 *
 * @package App\DTOs
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   16/09/2026
 *
 * @updated 16/09/2026
 */
final readonly class CreateCategoryData
{
    public function __construct(
        public int $contextId,
        public string $name,
        public CategoryType $type,
        public ?int $parentId = null,
        public ?string $color = null,
        public ?string $icon = null,
    ) {}
}
