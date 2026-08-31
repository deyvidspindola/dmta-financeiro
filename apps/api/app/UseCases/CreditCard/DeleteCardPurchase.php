<?php

declare(strict_types=1);

namespace App\UseCases\CreditCard;

use App\Models\CardInvoice;
use App\Models\CardPurchase;
use Illuminate\Support\Facades\DB;

/**
 * Apaga uma compra de cartão e desfaz o efeito dela: tira o valor do
 * `total_amount` da fatura. Não toca em saldo de conta (compra no cartão
 * nunca moveu saldo).
 *
 * O que NÃO faz: não reabre uma fatura já paga — apagar compra de fatura
 * paga é caso de borda que a tela deve impedir; aqui só o total é
 * ajustado.
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
final class DeleteCardPurchase
{
    public function execute(CardPurchase $purchase): void
    {
        DB::transaction(function () use ($purchase): void {
            CardInvoice::query()->whereKey($purchase->card_invoice_id)->lockForUpdate()
                ->decrement('total_amount', (float) $purchase->amount);

            $purchase->delete();
        });
    }
}
