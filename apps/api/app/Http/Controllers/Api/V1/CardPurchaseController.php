<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\DTOs\RegisterCardPurchaseData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreCardPurchaseRequest;
use App\Http\Resources\CardPurchaseResource;
use App\Models\CardInvoice;
use App\Models\CardPurchase;
use App\Models\Context;
use App\Models\CreditCard;
use App\UseCases\CreditCard\DeleteCardPurchase;
use App\UseCases\CreditCard\RegisterCardPurchase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Compras lançadas num cartão de crédito. Cada compra cai numa
 * {@see CardInvoice} pelo dia de fechamento — ver
 * {@see RegisterCardPurchase}.
 *
 * @package App\Http\Controllers\Api\V1
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   01/09/2026
 *
 * @updated 01/09/2026
 */
final class CardPurchaseController extends Controller
{
    /** Lista as compras do cartão; `?invoice_id=` filtra por fatura. */
    public function index(Request $request, Context $context, CreditCard $creditCard): AnonymousResourceCollection
    {
        $purchases = $creditCard->purchases()
            ->when($request->filled('invoice_id'), fn ($query) => $query->where('card_invoice_id', $request->integer('invoice_id')))
            ->latest('occurred_at')
            ->get();

        return CardPurchaseResource::collection($purchases);
    }

    public function store(
        StoreCardPurchaseRequest $request,
        Context $context,
        CreditCard $creditCard,
        RegisterCardPurchase $useCase,
    ): CardPurchaseResource {
        $purchase = $useCase->execute(new RegisterCardPurchaseData(
            contextId: $context->id,
            creditCardId: $creditCard->id,
            description: $request->string('description')->toString(),
            amount: (float) $request->input('amount'),
            occurredAt: $request->string('occurred_at')->toString(),
            categoryId: $request->integer('category_id') ?: null,
        ));

        return new CardPurchaseResource($purchase);
    }

    public function destroy(
        Context $context,
        CreditCard $creditCard,
        CardPurchase $purchase,
        DeleteCardPurchase $useCase,
    ): JsonResponse {
        $useCase->execute($purchase);

        return response()->json(status: 204);
    }
}
