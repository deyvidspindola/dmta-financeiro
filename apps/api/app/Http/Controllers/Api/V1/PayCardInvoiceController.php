<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\DTOs\PayCardInvoiceData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\PayCardInvoiceRequest;
use App\Http\Resources\StatementEntryResource;
use App\Models\CardInvoice;
use App\Models\Context;
use App\Models\CreditCard;
use App\UseCases\CreditCard\PayCardInvoice;

/**
 * Pagamento da fatura de um cartão — cria o lançamento de despesa na
 * conta escolhida e marca a fatura como paga. Ver {@see PayCardInvoice}.
 * É uma ação customizada (`.../invoices/{invoice}/pay`), não CRUD (DT-08).
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
final class PayCardInvoiceController extends Controller
{
    public function __invoke(
        PayCardInvoiceRequest $request,
        Context $context,
        CreditCard $creditCard,
        CardInvoice $invoice,
        PayCardInvoice $useCase,
    ): StatementEntryResource {
        $entry = $useCase->execute($invoice, new PayCardInvoiceData(
            accountId: $request->integer('account_id'),
            occurredAt: $request->input('occurred_at'),
        ));

        return new StatementEntryResource($entry);
    }
}
