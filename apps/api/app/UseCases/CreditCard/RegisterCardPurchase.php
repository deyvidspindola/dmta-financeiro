<?php

declare(strict_types=1);

namespace App\UseCases\CreditCard;

use App\Domain\CreditCard\InvoiceAllocator;
use App\DTOs\RegisterCardPurchaseData;
use App\Enums\CardInvoiceStatus;
use App\Models\CardInvoice;
use App\Models\CardPurchase;
use App\Models\CreditCard;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Lança uma compra num cartão: resolve a fatura pelo dia de fechamento
 * ({@see InvoiceAllocator}), cria/reaproveita a {@see CardInvoice} `open`
 * daquele mês de referência e soma o valor no `total_amount` dela — o
 * mesmo padrão de coluna materializada de `accounts.balance`.
 *
 * O que NÃO faz: não move saldo de conta nenhuma (compra no cartão só
 * vira saldo quando a fatura é paga); não fecha nem parcela a fatura
 * (fases seguintes).
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
final class RegisterCardPurchase
{
    public function __construct(private readonly InvoiceAllocator $allocator) {}

    public function execute(RegisterCardPurchaseData $data): CardPurchase
    {
        return DB::transaction(function () use ($data): CardPurchase {
            /** @var CreditCard $card */
            $card = CreditCard::query()->whereKey($data->creditCardId)->lockForUpdate()->firstOrFail();

            $window = $this->allocator->allocate(
                Carbon::parse($data->occurredAt),
                (int) $card->closing_day,
                (int) $card->due_day,
            );
            $referenceMonth = $window['reference_month']->toDateString();

            // whereDate: a coluna reference_month é `date`, comparar como
            // string crua não bate com o valor materializado pelo cast.
            $invoice = CardInvoice::query()
                ->where('credit_card_id', $card->id)
                ->whereDate('reference_month', $referenceMonth)
                ->lockForUpdate()
                ->first()
                ?? CardInvoice::create([
                    'credit_card_id' => $card->id,
                    'reference_month' => $referenceMonth,
                    'status' => CardInvoiceStatus::Open->value,
                    'due_date' => $window['due_date']->toDateString(),
                    'total_amount' => 0,
                ]);

            $purchase = CardPurchase::create([
                'context_id' => $data->contextId,
                'credit_card_id' => $card->id,
                'card_invoice_id' => $invoice->id,
                'category_id' => $data->categoryId,
                'description' => $data->description,
                'amount' => $data->amount,
                'occurred_at' => $data->occurredAt,
            ]);

            $invoice->increment('total_amount', $data->amount);

            return $purchase;
        });
    }
}
