<?php

declare(strict_types=1);

namespace App\UseCases\CreditCard;

use App\Enums\CardInvoiceStatus;
use App\Exceptions\Domain\CardPurchaseNotEditableException;
use App\Models\CardInvoice;
use App\Models\CardPurchase;
use Illuminate\Support\Facades\DB;

/**
 * Apaga uma compra de cartão e desfaz o efeito dela: tira o valor do
 * `total_amount` da fatura. Não toca em saldo de conta (compra no cartão
 * nunca moveu saldo).
 *
 * `$entireGroup` apaga todas as parcelas da mesma compra parcelada (mesmo
 * `installment_group`), cada uma revertendo a sua fatura — apagar só uma
 * parcela de uma compra em 12x quase nunca é o que se quer.
 *
 * O que NÃO faz: não reabre uma fatura já paga.
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
final class DeleteCardPurchase
{
    /** @throws CardPurchaseNotEditableException Se a compra está numa fatura já paga. */
    public function execute(CardPurchase $purchase, bool $entireGroup = false): void
    {
        DB::transaction(function () use ($purchase, $entireGroup): void {
            $targets = $entireGroup && $purchase->installment_group !== null
                ? CardPurchase::query()->where('installment_group', $purchase->installment_group)->get()
                : collect([$purchase]);

            $targets->each(function (CardPurchase $target): void {
                /** @var CardInvoice $invoice */
                $invoice = CardInvoice::query()->whereKey($target->card_invoice_id)->lockForUpdate()->firstOrFail();

                // @phpstan-ignore-next-line identical.alwaysFalse (cast CardInvoiceStatus confirmado em runtime)
                if ($invoice->status === CardInvoiceStatus::Paid) {
                    throw new CardPurchaseNotEditableException;
                }

                $invoice->decrement('total_amount', (float) $target->amount);
                $target->delete();
            });
        });
    }
}
