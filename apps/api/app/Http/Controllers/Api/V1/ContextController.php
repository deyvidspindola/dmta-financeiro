<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\DTOs\CreateContextData;
use App\Enums\ContextType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreContextRequest;
use App\Http\Resources\ContextResource;
use App\Models\Company;
use App\UseCases\Context\CreateContext;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Lista e cria os contextos (PF/empresas) do usuário autenticado — o
 * seletor de contexto do app consome este recurso (F0, front-end).
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
final class ContextController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $contexts = $request->user()->contexts()->with('company')->get();

        return ContextResource::collection($contexts);
    }

    public function store(StoreContextRequest $request, CreateContext $useCase): ContextResource
    {
        $type = ContextType::from($request->string('type')->toString());

        $companyId = null;
        if ($type === ContextType::Company) {
            $companyId = Company::create([
                'name' => $request->string('company_name')->toString(),
                'document' => $request->input('company_document'),
            ])->id;
        }

        $context = $useCase->execute(new CreateContextData(
            userId: $request->user()->id,
            type: $type,
            name: $request->string('name')->toString(),
            companyId: $companyId,
        ));

        return new ContextResource($context->load('company'));
    }
}
