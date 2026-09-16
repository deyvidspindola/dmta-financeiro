<?php

declare(strict_types=1);

namespace App\UseCases\Category;

use App\DTOs\UpdateCategoryData;
use App\Exceptions\Domain\CategoryHasChildrenException;
use App\Exceptions\Domain\CategoryParentMismatchException;
use App\Exceptions\Domain\CategoryTypeMismatchException;
use App\Models\Category;

/**
 * Renomeia uma categoria, atualiza cor/ícone e, opcionalmente, muda sua
 * categoria-mãe — ver docblock de {@see UpdateCategoryData} pro
 * `parentProvided`. `type` não é editável aqui: mudar o tipo de uma
 * categoria que já tem lançamento vinculado é uma decisão que não existe
 * ainda no produto (registre em PROGRESSO.md se isso virar pedido real,
 * não implemente por conta).
 *
 * @package App\UseCases\Category
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.2.0
 *
 * @since   21/08/2026
 *
 * @updated 16/09/2026
 *
 * @throws CategoryHasChildrenException Se a categoria já tem subcategoria própria.
 * @throws CategoryParentMismatchException Se a nova mãe não existe, é a própria categoria, é de outro contexto ou não é raiz.
 * @throws CategoryTypeMismatchException Se a nova mãe tiver tipo (despesa/receita) diferente.
 */
final class UpdateCategory
{
    public function execute(Category $category, UpdateCategoryData $data): Category
    {
        $attributes = [
            'name' => $data->name,
            'color' => $data->color,
            'icon' => $data->icon,
        ];

        if ($data->parentProvided) {
            $attributes['parent_id'] = $this->resolveParentId($category, $data->parentId);
        }

        $category->update($attributes);

        return $category->refresh();
    }

    private function resolveParentId(Category $category, ?int $parentId): ?int
    {
        if ($parentId === $category->parent_id) {
            return $parentId;
        }

        if ($category->children()->exists()) {
            throw new CategoryHasChildrenException;
        }

        if ($parentId === null) {
            return null;
        }

        if ($parentId === $category->id) {
            throw new CategoryParentMismatchException;
        }

        /** @var Category|null $parent */
        $parent = Category::query()->whereKey($parentId)->where('context_id', $category->context_id)->first();

        if ($parent === null || ! $parent->isRoot()) {
            throw new CategoryParentMismatchException;
        }

        if ($parent->type !== $category->type) {
            throw new CategoryTypeMismatchException;
        }

        return $parentId;
    }
}
