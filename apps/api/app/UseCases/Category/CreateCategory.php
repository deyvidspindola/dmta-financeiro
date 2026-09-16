<?php

declare(strict_types=1);

namespace App\UseCases\Category;

use App\DTOs\CreateCategoryData;
use App\Exceptions\Domain\CategoryParentMismatchException;
use App\Exceptions\Domain\CategoryTypeMismatchException;
use App\Models\Category;

/**
 * Cria uma categoria ou subcategoria (D-12), sempre chamado a partir do
 * modal de cadastro rápido — nunca existe uma tela de CRUD dedicada.
 *
 * @package App\UseCases\Category
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   21/08/2026
 *
 * @updated 16/09/2026
 */
final class CreateCategory
{
    /**
     * @throws CategoryParentMismatchException Se `parentId` for de outro contexto.
     * @throws CategoryTypeMismatchException Se `type` divergir do tipo da categoria-mãe.
     */
    public function execute(CreateCategoryData $data): Category
    {
        if ($data->parentId !== null) {
            /** @var Category|null $parent */
            $parent = Category::query()->whereKey($data->parentId)->where('context_id', $data->contextId)->first();

            if ($parent === null) {
                throw new CategoryParentMismatchException;
            }

            // @phpstan-ignore-next-line notIdentical.alwaysTrue (cast CategoryType da migration — larastan não infere casts() aqui)
            if ($parent->type !== $data->type) {
                throw new CategoryTypeMismatchException;
            }
        }

        return Category::create([
            'context_id' => $data->contextId,
            'parent_id' => $data->parentId,
            'name' => $data->name,
            'type' => $data->type->value,
            'color' => $data->color,
            'icon' => $data->icon,
        ]);
    }
}
