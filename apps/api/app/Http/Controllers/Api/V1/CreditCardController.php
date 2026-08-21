<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\DTOs\RegisterCreditCardData;
use App\Http\Controllers\Api\V1\Concerns\AuthorizesContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreCreditCardRequest;
use App\Http\Resources\CreditCardResource;
use App\Models\Context;
use App\UseCases\CreditCard\RegisterCreditCard;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Cartões de crédito de cadastro manual (capítulo 08, F0).
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
final class CreditCardController extends Controller
{
    use AuthorizesContext;

    public function index(Context $context): AnonymousResourceCollection
    {
        $this->assertOwnsContext($context);

        return CreditCardResource::collection($context->creditCards()->get());
    }

    public function store(
        StoreCreditCardRequest $request,
        Context $context,
        RegisterCreditCard $useCase,
    ): CreditCardResource {
        $this->assertOwnsContext($context);

        $card = $useCase->execute(new RegisterCreditCardData(
            contextId: $context->id,
            name: $request->string('name')->toString(),
            closingDay: $request->integer('closing_day'),
            dueDay: $request->integer('due_day'),
            brand: $request->input('brand'),
            creditLimit: $request->has('credit_limit') ? (float) $request->input('credit_limit') : null,
        ));

        return new CreditCardResource($card);
    }
}
