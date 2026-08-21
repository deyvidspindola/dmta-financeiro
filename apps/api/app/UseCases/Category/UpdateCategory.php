<?php

declare(strict_types=1);

namespace App\UseCases\Category;

use App\Models\Category;

/**
 * Renomeia uma categoria. Só o nome — `type` e `parent_id` não são
 * editáveis aqui: mudar o tipo de uma categoria que já tem lançamento
 * vinculado é uma decisão que não existe ainda no produto (registre em
 * PROGRESSO.md se isso virar pedido real, não implemente por conta).
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
final class UpdateCategory
{
    public function execute(Category $category, string $name): Category
    {
        $category->update(['name' => $name]);

        return $category;
    }
}
