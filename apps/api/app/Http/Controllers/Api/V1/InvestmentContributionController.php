<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\DTOs\RegisterInvestmentContributionData;
use App\Http\Controllers\Api\V1\Concerns\AuthorizesContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreInvestmentContributionRequest;
use App\Http\Resources\InvestmentContributionResource;
use App\Models\Context;
use App\Models\Investment;
use App\UseCases\Investment\RegisterInvestmentContribution;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Aportes manuais de um investimento (D-14 — sem rentabilidade automática).
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
final class InvestmentContributionController extends Controller
{
    use AuthorizesContext;

    public function index(Context $context, Investment $investment): AnonymousResourceCollection
    {
        $this->assertOwnsContext($context);
        $this->assertBelongsToContext($context, $investment);

        return InvestmentContributionResource::collection(
            $investment->contributions()->orderByDesc('occurred_at')->get(),
        );
    }

    public function store(
        StoreInvestmentContributionRequest $request,
        Context $context,
        Investment $investment,
        RegisterInvestmentContribution $useCase,
    ): InvestmentContributionResource {
        $this->assertOwnsContext($context);
        $this->assertBelongsToContext($context, $investment);

        $contribution = $useCase->execute(new RegisterInvestmentContributionData(
            investmentId: $investment->id,
            amount: (float) $request->input('amount'),
            occurredAt: $request->string('occurred_at')->toString(),
            note: $request->input('note'),
        ));

        return new InvestmentContributionResource($contribution);
    }
}
