<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\DTOs\RegisterCreditCardData;
use App\DTOs\UpdateCreditCardData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreCreditCardRequest;
use App\Http\Requests\Api\UpdateCreditCardRequest;
use App\Http\Resources\CreditCardResource;
use App\Models\Context;
use App\Models\CreditCard;
use App\UseCases\CreditCard\RegisterCreditCard;
use App\UseCases\CreditCard\UpdateCreditCard;
use Illuminate\Http\JsonResponse;
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
    public function index(Context $context): AnonymousResourceCollection
    {
        $cards = $context->creditCards()
            ->withSum(
                ['invoices as unpaid_invoices_total' => fn ($query) => $query->where('status', '!=', 'paid')],
                'total_amount',
            )
            ->withSum(
                ['invoices as open_invoice_total' => fn ($query) => $query->where('status', 'open')],
                'total_amount',
            )
            ->get();

        return CreditCardResource::collection($cards);
    }

    public function store(StoreCreditCardRequest $request, Context $context, RegisterCreditCard $useCase): CreditCardResource
    {
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

    public function update(UpdateCreditCardRequest $request, Context $context, CreditCard $creditCard, UpdateCreditCard $useCase): CreditCardResource
    {
        $updated = $useCase->execute($creditCard, new UpdateCreditCardData(
            name: $request->string('name')->toString(),
            closingDay: $request->integer('closing_day'),
            dueDay: $request->integer('due_day'),
            brand: $request->input('brand'),
            creditLimit: $request->has('credit_limit') ? (float) $request->input('credit_limit') : null,
        ));

        return new CreditCardResource($updated);
    }

    /** Apaga o cartão e, em cascata (FK), as faturas dele. */
    public function destroy(Context $context, CreditCard $creditCard): JsonResponse
    {
        $creditCard->delete();

        return response()->json(status: 204);
    }
}
