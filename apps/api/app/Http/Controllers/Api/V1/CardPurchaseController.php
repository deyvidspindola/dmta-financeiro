<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\DTOs\RegisterCardPurchaseData;
use App\DTOs\UpdateCardPurchaseData;
use App\Enums\RecurrenceInterval;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreCardPurchaseRequest;
use App\Http\Requests\Api\UpdateCardPurchaseRequest;
use App\Http\Resources\CardPurchaseResource;
use App\Http\Resources\RecurringTransactionResource;
use App\Models\CardInvoice;
use App\Models\CardPurchase;
use App\Models\Context;
use App\Models\CreditCard;
use App\UseCases\CreditCard\DeleteCardPurchase;
use App\UseCases\CreditCard\RegisterCardPurchase;
use App\UseCases\CreditCard\RegisterCardSubscription;
use App\UseCases\CreditCard\UpdateCardPurchase;
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
 * @version 1.1.0
 *
 * @since   01/09/2026
 *
 * @updated 23/09/2026
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

    /**
     * Lança uma compra. Com `recurring=true` vira assinatura
     * ({@see RegisterCardSubscription}) — devolve a 1ª cobrança ou, se ela
     * cai além do horizonte do cartão, a regra.
     */
    public function store(
        StoreCardPurchaseRequest $request,
        Context $context,
        CreditCard $creditCard,
        RegisterCardPurchase $useCase,
        RegisterCardSubscription $subscription,
    ): JsonResponse {
        $data = new RegisterCardPurchaseData(
            contextId: $context->id,
            creditCardId: $creditCard->id,
            description: $request->string('description')->toString(),
            amount: (float) $request->input('amount'),
            occurredAt: $request->string('occurred_at')->toString(),
            categoryId: $request->integer('category_id') ?: null,
            installments: $request->integer('installments') ?: 1,
        );

        $created = $request->boolean('recurring')
            ? $subscription->execute(
                $data,
                RecurrenceInterval::from($request->string('interval')->toString()),
                $request->filled('end_date') ? $request->string('end_date')->toString() : null,
            )
            : $useCase->execute($data);

        $resource = $created instanceof CardPurchase ? new CardPurchaseResource($created) : new RecurringTransactionResource($created);

        return $resource->response()->setStatusCode(201);
    }

    /** Edita uma compra simples (não parcelada, fatura não paga) — ver {@see UpdateCardPurchase}. */
    public function update(
        UpdateCardPurchaseRequest $request,
        Context $context,
        CreditCard $creditCard,
        CardPurchase $purchase,
        UpdateCardPurchase $useCase,
    ): CardPurchaseResource {
        $updated = $useCase->execute($purchase, new UpdateCardPurchaseData(
            description: $request->string('description')->toString(),
            amount: (float) $request->input('amount'),
            occurredAt: $request->string('occurred_at')->toString(),
            categoryId: $request->integer('category_id') ?: null,
        ));

        return new CardPurchaseResource($updated);
    }

    /** `?scope=group` apaga a compra parcelada inteira, não só esta parcela. */
    public function destroy(
        Request $request,
        Context $context,
        CreditCard $creditCard,
        CardPurchase $purchase,
        DeleteCardPurchase $useCase,
    ): JsonResponse {
        $useCase->execute($purchase, $request->query('scope') === 'group');

        return response()->json(status: 204);
    }
}
