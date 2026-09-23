<?php

declare(strict_types=1);

namespace App\UseCases\Transaction;

use App\Enums\CardInvoiceStatus;
use App\Models\CardPurchase;
use App\Models\RecurringTransaction;
use App\UseCases\CreditCard\DeleteCardPurchase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Cancela uma regra de recorrência — não apaga nem desfaz as ocorrências
 * já geradas (cada `StatementEntry` gerado é um lançamento normal, some
 * junto com ele só se apagado individualmente); só impede que o job
 * gere ocorrências novas a partir de agora.
 *
 * Exceção: assinatura no cartão. A compra da próxima cobrança já é
 * materializada adiantada na fatura (ver
 * `RecurringTransactionMaterializer::CARD_HORIZON_MONTHS`); cancelar a
 * assinatura apaga essas compras com data futura (em fatura não paga) —
 * cobrança que não vai mais acontecer não pode ficar somando na fatura.
 *
 * @package App\UseCases\Transaction
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   21/08/2026
 *
 * @updated 23/09/2026
 */
final class CancelRecurringTransaction
{
    public function __construct(private readonly DeleteCardPurchase $deleteCardPurchase) {}

    public function execute(RecurringTransaction $recurringTransaction): void
    {
        DB::transaction(function () use ($recurringTransaction): void {
            $recurringTransaction->update(['active' => false]);

            if (! $recurringTransaction->isCreditCard()) {
                return;
            }

            CardPurchase::query()
                ->where('recurring_transaction_id', $recurringTransaction->id)
                ->whereDate('occurred_at', '>', Carbon::today()->toDateString())
                ->whereHas('cardInvoice', fn ($query) => $query->where('status', '!=', CardInvoiceStatus::Paid->value))
                ->get()
                ->each(fn (CardPurchase $purchase) => $this->deleteCardPurchase->execute($purchase));
        });
    }
}
