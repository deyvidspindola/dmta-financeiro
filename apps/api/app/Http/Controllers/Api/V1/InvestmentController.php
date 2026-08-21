<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\DTOs\RegisterInvestmentData;
use App\Http\Controllers\Api\V1\Concerns\AuthorizesContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreInvestmentRequest;
use App\Http\Resources\InvestmentResource;
use App\Models\Context;
use App\UseCases\Investment\RegisterInvestment;
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
    use AuthorizesContext;

    public function index(Context $context): AnonymousResourceCollection
    {
        $this->assertOwnsContext($context);

        return InvestmentResource::collection($context->investments()->get());
    }

    public function store(
        StoreInvestmentRequest $request,
        Context $context,
        RegisterInvestment $useCase,
    ): InvestmentResource {
        $this->assertOwnsContext($context);

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
}
