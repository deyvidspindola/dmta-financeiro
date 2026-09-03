<?php

declare(strict_types=1);

namespace App\UseCases\CreditCard;

use App\Enums\CardInvoiceStatus;
use App\Exceptions\Domain\CreditCardHasPaidInvoicesException;
use App\Models\CreditCard;
use Illuminate\Support\Facades\DB;

/**
 * Exclui um cartão e, em cascata, as faturas e compras dele. Os
 * lançamentos de pagamento de fatura (que já moveram saldo) NÃO somem —
 * o `card_invoice_id` deles vira `null` (FK `nullOnDelete`) e continuam
 * no extrato da conta.
 *
 * Com fatura paga só exclui se `force` — para o usuário confirmar que
 * entende que o histórico do cartão vai embora.
 *
 * @package App\UseCases\CreditCard
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   03/09/2026
 *
 * @updated 03/09/2026
 */
final class DeleteCreditCard
{
    /** @throws CreditCardHasPaidInvoicesException Se tem fatura paga e `force` é `false`. */
    public function execute(CreditCard $card, bool $force = false): void
    {
        if (! $force && $this->hasPaidInvoice($card)) {
            throw new CreditCardHasPaidInvoicesException;
        }

        DB::transaction(fn () => $card->delete());
    }

    private function hasPaidInvoice(CreditCard $card): bool
    {
        return $card->invoices()->where('status', CardInvoiceStatus::Paid->value)->exists();
    }
}
