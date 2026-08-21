<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\DTOs\RegisterCardInvoiceData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreCardInvoiceRequest;
use App\Http\Resources\CardInvoiceResource;
use App\Models\CardInvoice;
use App\Models\Context;
use App\Models\CreditCard;
use App\UseCases\CreditCard\RegisterCardInvoice;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Faturas de um cartão, uma por mês de referência (F0 registra só o
 * resumo — ver docblock de {@see CardInvoice}).
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
final class CardInvoiceController extends Controller
{
    public function index(Context $context, CreditCard $creditCard): AnonymousResourceCollection
    {
        return CardInvoiceResource::collection($creditCard->invoices()->orderByDesc('reference_month')->get());
    }

    public function store(
        StoreCardInvoiceRequest $request,
        Context $context,
        CreditCard $creditCard,
        RegisterCardInvoice $useCase,
    ): CardInvoiceResource {
        $invoice = $useCase->execute(new RegisterCardInvoiceData(
            creditCardId: $creditCard->id,
            referenceMonth: $request->string('reference_month')->toString(),
            totalAmount: (float) $request->input('total_amount'),
            dueDate: $request->string('due_date')->toString(),
        ));

        return new CardInvoiceResource($invoice);
    }
}
