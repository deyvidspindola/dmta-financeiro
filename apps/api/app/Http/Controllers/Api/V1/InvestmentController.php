<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\DTOs\RegisterInvestmentData;
use App\DTOs\UpdateInvestmentData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreInvestmentRequest;
use App\Http\Requests\Api\UpdateInvestmentRequest;
use App\Http\Resources\InvestmentResource;
use App\Models\Context;
use App\Models\Investment;
use App\UseCases\Investment\RegisterInvestment;
use App\UseCases\Investment\UpdateInvestment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Posições de investimento manuais, sem rentabilidade automática (D-14).
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
final class InvestmentController extends Controller
{
    public function index(Context $context): AnonymousResourceCollection
    {
        return InvestmentResource::collection($context->investments()->get());
    }

    public function store(StoreInvestmentRequest $request, Context $context, RegisterInvestment $useCase): InvestmentResource
    {
        $investment = $useCase->execute(new RegisterInvestmentData(
            contextId: $context->id,
            name: $request->string('name')->toString(),
            initialAmount: (float) $request->input('initial_amount'),
            currentAmount: (float) $request->input('current_amount'),
            type: $request->input('type'),
            broker: $request->input('broker'),
            acquiredAt: $request->input('acquired_at'),
        ));

        return new InvestmentResource($investment);
    }

    public function update(UpdateInvestmentRequest $request, Context $context, Investment $investment, UpdateInvestment $useCase): InvestmentResource
    {
        $updated = $useCase->execute($investment, new UpdateInvestmentData(
            name: $request->string('name')->toString(),
            currentAmount: (float) $request->input('current_amount'),
            type: $request->input('type'),
            broker: $request->input('broker'),
        ));

        return new InvestmentResource($updated);
    }

    /** Apaga o investimento e, em cascata (FK), o histórico de aportes dele. */
    public function destroy(Context $context, Investment $investment): JsonResponse
    {
        $investment->delete();

        return response()->json(status: 204);
    }
}
