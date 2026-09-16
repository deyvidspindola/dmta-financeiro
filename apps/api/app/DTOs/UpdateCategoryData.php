<?php

declare(strict_types=1);

namespace App\DTOs;

use App\UseCases\Category\UpdateCategory;

/**
 * Entrada do caso de uso {@see UpdateCategory}. `type` não está aqui de
 * propósito — ver docblock de {@see UpdateCategory}. `parentProvided`
 * distingue "não mandou o campo" (mantém a mãe atual) de "mandou null"
 * (promove a raiz) — o `parent_id` sozinho não dá pra diferenciar os dois.
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
final readonly class UpdateCategoryData
{
    public function __construct(
        public string $name,
        public ?string $color = null,
        public ?string $icon = null,
        public bool $parentProvided = false,
        public ?int $parentId = null,
    ) {}
}
