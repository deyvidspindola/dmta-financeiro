<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\CategoryType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreCategoryRequest;
use App\Http\Requests\Api\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Models\Context;
use App\UseCases\Category\CreateCategory;
use App\UseCases\Category\UpdateCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
    /** `?type=expense|income` filtra a listagem — usado pelo select de categoria em cada formulário. */
    public function index(Request $request, Context $context): AnonymousResourceCollection
    {
        $query = $context->categories();

        if ($request->filled('type')) {
            $query->where('type', $request->string('type')->toString());
        }

        return CategoryResource::collection($query->get());
    }

    public function store(StoreCategoryRequest $request, Context $context, CreateCategory $useCase): CategoryResource
    {
        $category = $useCase->execute(
            $context->id,
            $request->string('name')->toString(),
            CategoryType::from($request->string('type')->toString()),
            $request->integer('parent_id') ?: null,
        );

        return new CategoryResource($category);
    }

    public function update(
        UpdateCategoryRequest $request,
        Context $context,
        Category $category,
        UpdateCategory $useCase,
    ): CategoryResource {
        $updated = $useCase->execute($category, $request->string('name')->toString());

        return new CategoryResource($updated);
    }

    /** Apaga a categoria — subcategoria e lançamento/boleto vinculado só ficam sem categoria (FK `nullOnDelete`). */
    public function destroy(Context $context, Category $category): JsonResponse
    {
        $category->delete();

        return response()->json(status: 204);
    }
}
