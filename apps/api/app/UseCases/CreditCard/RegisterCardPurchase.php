<?php

declare(strict_types=1);

namespace App\UseCases\CreditCard;

use App\Domain\CreditCard\InstallmentPlan;
use App\Domain\CreditCard\InvoiceAllocator;
use App\DTOs\RegisterCardPurchaseData;
use App\Models\CardPurchase;
use App\Models\CreditCard;
use App\Services\CardInvoiceResolver;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Lança uma compra num cartão: resolve a fatura pelo dia de fechamento
 * ({@see InvoiceAllocator} + {@see CardInvoiceResolver}) e soma o valor
 * no `total_amount` dela (coluna materializada, mesmo padrão de
 * `accounts.balance`).
 *
 * `installments > 1` divide a compra em N parcelas ({@see InstallmentPlan}),
 * uma por fatura de mês consecutivo, todas com o mesmo `installment_group`
 * — devolve sempre a primeira parcela.
 *
 * O que NÃO faz: não move saldo de conta (compra no cartão só vira saldo
 * quando a fatura é paga, {@see PayCardInvoice}); não fecha a fatura.
 *
 * @package App\UseCases\CreditCard
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   01/09/2026
 *
 * @updated 01/09/2026
 */
final class RegisterCardPurchase
{
    public function __construct(
        private readonly InvoiceAllocator $allocator,
        private readonly InstallmentPlan $plan,
        private readonly CardInvoiceResolver $invoices,
    ) {}

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

            $count = max(1, $data->installments);
            $amounts = $this->plan->split($data->amount, $count);
            $group = $count > 1 ? (string) Str::uuid() : null;

            $first = $this->addInstallment($data, $card, $window, 1, $count, $amounts[0], $group);

            for ($k = 1; $k < $count; $k++) {
                $this->addInstallment($data, $card, $window, $k + 1, $count, $amounts[$k], $group);
            }

            return $first;
        });
    }

    /**
     * Cria a parcela `$number` na fatura `$number - 1` meses após a janela
     * da primeira parcela e soma o valor na fatura.
     *
     * @param  array{reference_month: Carbon, due_date: Carbon}  $window
     */
    private function addInstallment(
        RegisterCardPurchaseData $data,
        CreditCard $card,
        array $window,
        int $number,
        int $total,
        float $amount,
        ?string $group,
    ): CardPurchase {
        $offset = $number - 1;
        $invoice = $this->invoices->forMonth(
            $card,
            $window['reference_month']->copy()->addMonthsNoOverflow($offset),
            $window['due_date']->copy()->addMonthsNoOverflow($offset),
        );

        $purchase = CardPurchase::create([
            'context_id' => $data->contextId,
            'credit_card_id' => $card->id,
            'card_invoice_id' => $invoice->id,
            'category_id' => $data->categoryId,
            'description' => $data->description,
            'amount' => $amount,
            'occurred_at' => $data->occurredAt,
            'installment_number' => $total > 1 ? $number : null,
            'installment_total' => $total > 1 ? $total : null,
            'installment_group' => $group,
        ]);

        $invoice->increment('total_amount', $amount);

        return $purchase;
    }
}
