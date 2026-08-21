<?php

declare(strict_types=1);

namespace App\UseCases\Category;

use App\Exceptions\Domain\CategoryParentMismatchException;
use App\Models\Category;

/**
 * Cria uma categoria ou subcategoria (D-12), sempre chamado a partir do
 * modal de cadastro rápido — nunca existe uma tela de CRUD dedicada.
 *
 * @package App\UseCases\Category
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final class CreateCategory
{
    /** @throws CategoryParentMismatchException Se `parentId` for de outro contexto. */
    public function execute(int $contextId, string $name, ?int $parentId = null): Category
    {
        if ($parentId !== null) {
            $parentBelongsToContext = Category::query()
                ->whereKey($parentId)
                ->where('context_id', $contextId)
                ->exists();

            if (! $parentBelongsToContext) {
                throw new CategoryParentMismatchException;
            }
        }

        return Category::create([
            'context_id' => $contextId,
            'parent_id' => $parentId,
            'name' => $name,
        ]);
    }
}
