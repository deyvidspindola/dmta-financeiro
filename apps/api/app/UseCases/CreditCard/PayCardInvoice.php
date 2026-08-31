<?php

declare(strict_types=1);

namespace App\UseCases\CreditCard;

use App\DTOs\PayCardInvoiceData;
use App\DTOs\RegisterTransactionData;
use App\Enums\CardInvoiceStatus;
use App\Enums\StatementEntryType;
use App\Exceptions\Domain\CardInvoiceAlreadyPaidException;
use App\Models\CardInvoice;
use App\Models\CreditCard;
use App\Models\StatementEntry;
use App\UseCases\Transaction\DeleteTransaction;
use App\UseCases\Transaction\RegisterTransaction;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Paga a fatura de um cartão: cria um lançamento de despesa na conta
 * escolhida (é aqui que a compra no cartão finalmente vira saldo movido)
 * e marca a fatura como `paid`. O lançamento carrega `card_invoice_id` —
 * apagá-lo reabre a fatura ({@see DeleteTransaction}).
 *
 * O que NÃO faz: não deixa pagar fatura já paga
 * ({@see CardInvoiceAlreadyPaidException}); não fecha a fatura antes (dá
 * pra antecipar o pagamento de uma fatura ainda `open`).
 *
 * @package App\UseCases\CreditCard
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   01/09/2026
 *
 * @updated 01/09/2026
 */
final class PayCardInvoice
{
    public function __construct(private readonly RegisterTransaction $registerTransaction) {}

    /** @throws CardInvoiceAlreadyPaidException */
    public function execute(CardInvoice $invoice, PayCardInvoiceData $data): StatementEntry
    {
        if ($invoice->isPaid()) {
            throw new CardInvoiceAlreadyPaidException;
        }

        return DB::transaction(function () use ($invoice, $data): StatementEntry {
            /** @var CreditCard $card */
            $card = $invoice->creditCard;
            $reference = Carbon::parse($invoice->reference_month)->format('m/Y');

            $entry = $this->registerTransaction->execute(new RegisterTransactionData(
                contextId: $card->context_id,
                accountId: $data->accountId,
                description: 'Fatura '.$card->name.' — '.$reference,
                amount: (float) $invoice->total_amount,
                type: StatementEntryType::Expense,
                occurredAt: $data->occurredAt ?? Carbon::today()->toDateString(),
                cardInvoiceId: $invoice->id,
            ));

            $invoice->update([
                'status' => CardInvoiceStatus::Paid->value,
                'paid_at' => now(),
            ]);

            return $entry;
        });
    }
}
