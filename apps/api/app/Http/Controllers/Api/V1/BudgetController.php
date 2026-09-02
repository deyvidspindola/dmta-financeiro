<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\DTOs\RegisterBudgetData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreBudgetRequest;
use App\Http\Requests\Api\UpdateBudgetRequest;
use App\Http\Resources\BudgetResource;
use App\Models\Budget;
use App\Models\Context;
use App\Services\BudgetConsumptionService;
use App\Services\BudgetProgressService;
use App\UseCases\Budget\CreateBudget;
use App\UseCases\Budget\UpdateBudget;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * Orçamento (teto de gasto) por categoria — feature de paridade com o
 * Mobills. `index` devolve o progresso do mês (gasto vs teto, já com o
 * rollup de subcategoria); `store`/`update`/`destroy` mexem no teto.
 *
 * @package App\Http\Controllers\Api\V1
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   02/09/2026
 *
 * @updated 02/09/2026
 */
final class BudgetController extends Controller
{
    /** `?month=YYYY-MM` (padrão: mês atual) — progresso de cada teto no mês. */
    public function index(Request $request, Context $context, BudgetProgressService $service): JsonResponse
    {
        $month = $request->filled('month')
            ? Carbon::parse($request->string('month')->toString())
            : Carbon::now();

        return response()->json(['data' => $service->forMonth($context, $month)]);
    }

    /** `?month=YYYY-MM` — o que está consumindo o teto (efetivado + previsto). */
    public function show(Request $request, Context $context, Budget $budget, BudgetConsumptionService $service): JsonResponse
    {
        $month = $request->filled('month')
            ? Carbon::parse($request->string('month')->toString())
            : Carbon::now();

        return response()->json(['data' => $service->forBudget($context, $budget, $month)]);
    }

    public function store(StoreBudgetRequest $request, Context $context, CreateBudget $useCase): BudgetResource
    {
        return new BudgetResource($useCase->execute(new RegisterBudgetData(
            contextId: $context->id,
            categoryId: $request->integer('category_id'),
            limitAmount: (float) $request->input('limit_amount'),
            month: $request->input('month'),
        )));
    }

    public function update(UpdateBudgetRequest $request, Context $context, Budget $budget, UpdateBudget $useCase): BudgetResource
    {
        return new BudgetResource($useCase->execute($budget, (float) $request->input('limit_amount')));
    }

    public function destroy(Context $context, Budget $budget): JsonResponse
    {
        $budget->delete();

        return response()->json(status: 204);
    }
}
