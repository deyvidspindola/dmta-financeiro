<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\AuthorizesContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Context;
use App\UseCases\Category\CreateCategory;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Categorias/subcategorias (D-12) — cadastro só via modal de outra tela,
 * nunca uma página de CRUD dedicada.
 *
 * @package App\Http\Controllers\Api\V1
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final class CategoryController extends Controller
{
    use AuthorizesContext;

    public function index(Context $context): AnonymousResourceCollection
    {
        $this->assertOwnsContext($context);

        return CategoryResource::collection($context->categories()->get());
    }

    public function store(StoreCategoryRequest $request, Context $context, CreateCategory $useCase): CategoryResource
    {
        $this->assertOwnsContext($context);

        $category = $useCase->execute(
            $context->id,
            $request->string('name')->toString(),
            $request->integer('parent_id') ?: null,
        );

        return new CategoryResource($category);
    }
}
