<?php

declare(strict_types=1);

namespace App\UseCases\CreditCard;

use App\Domain\CreditCard\InvoiceAllocator;
use App\DTOs\UpdateCardPurchaseData;
use App\Enums\CardInvoiceStatus;
use App\Exceptions\Domain\CardPurchaseNotEditableException;
use App\Models\CardInvoice;
use App\Models\CardPurchase;
use App\Models\CreditCard;
use App\Services\CardInvoiceResolver;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Edita uma compra de cartão simples (não parcelada). Desfaz o valor da
 * fatura antiga e aplica na fatura nova — se a data mudou pra outra
 * janela de fechamento, a compra migra de fatura ({@see InvoiceAllocator}
 * + {@see CardInvoiceResolver}), mesmo padrão do {@see RegisterCardPurchase}.
 *
 * Trocar `category_id` faz o orçamento por categoria reagir na hora —
 * `BudgetProjectionService` lê a compra ao vivo.
 *
 * Bloqueado ({@see CardPurchaseNotEditableException}) pra compra parcelada
 * ou em fatura já paga. Não move saldo de conta (compra no cartão nunca
 * moveu).
 *
 * @package App\UseCases\CreditCard
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   02/09/2026
 */
final class UpdateCardPurchase
{
    public function __construct(
        private readonly InvoiceAllocator $allocator,
        private readonly CardInvoiceResolver $invoices,
    ) {}

    /** @throws CardPurchaseNotEditableException */
    public function execute(CardPurchase $purchase, UpdateCardPurchaseData $data): CardPurchase
    {
        $currentInvoice = CardInvoice::query()->whereKey($purchase->card_invoice_id)->firstOrFail();

        if ($purchase->installment_group !== null || $this->isPaid($currentInvoice)) {
            throw new CardPurchaseNotEditableException;
        }

        return DB::transaction(function () use ($purchase, $data): CardPurchase {
            /** @var CreditCard $card */
            $card = CreditCard::query()->whereKey($purchase->credit_card_id)->lockForUpdate()->firstOrFail();

            CardInvoice::query()->whereKey($purchase->card_invoice_id)->lockForUpdate()
                ->decrement('total_amount', (float) $purchase->amount);

            $window = $this->allocator->allocate(
                Carbon::parse($data->occurredAt),
                (int) $card->closing_day,
                (int) $card->due_day,
            );
            $invoice = $this->invoices->forMonth($card, $window['reference_month'], $window['due_date']);

            if ($this->isPaid($invoice)) {
                throw new CardPurchaseNotEditableException;
            }

            $invoice->increment('total_amount', $data->amount);

            $purchase->update([
                'card_invoice_id' => $invoice->id,
                'category_id' => $data->categoryId,
                'description' => $data->description,
                'amount' => $data->amount,
                'occurred_at' => $data->occurredAt,
            ]);

            return $purchase->fresh();
        });
    }

    private function isPaid(CardInvoice $invoice): bool
    {
        // @phpstan-ignore-next-line identical.alwaysFalse (cast CardInvoiceStatus confirmado em runtime)
        return $invoice->status === CardInvoiceStatus::Paid;
    }
}
