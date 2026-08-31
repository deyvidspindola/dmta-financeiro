<?php

declare(strict_types=1);

namespace App\UseCases\CreditCard;

use App\Domain\CreditCard\InvoiceSchedule;
use App\Enums\CardInvoiceStatus;
use App\Models\CardInvoice;
use App\Models\CreditCard;
use Illuminate\Support\Carbon;

/**
 * Fecha as faturas `open` de um cartão cuja data de fechamento já passou
 * ({@see InvoiceSchedule}). Idempotente — só age em `open`, rodar de novo
 * não faz nada.
 *
 * O que NÃO faz: não cria a próxima fatura (ela nasce sozinha na primeira
 * compra do ciclo seguinte, via {@see RegisterCardPurchase}); não paga
 * nada ({@see PayCardInvoice} é fase seguinte).
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
final class CloseCardInvoices
{
    public function __construct(private readonly InvoiceSchedule $schedule) {}

    /** @return int Quantidade de faturas fechadas. */
    public function execute(CreditCard $card): int
    {
        $today = Carbon::today();
        $closed = 0;

        $card->invoices()
            ->where('status', CardInvoiceStatus::Open->value)
            ->get()
            ->each(function (CardInvoice $invoice) use ($card, $today, &$closed): void {
                $closingDate = $this->schedule->closingDateFor(
                    Carbon::parse($invoice->reference_month),
                    (int) $card->closing_day,
                );

                if ($closingDate->lt($today)) {
                    $invoice->update(['status' => CardInvoiceStatus::Closed->value]);
                    $closed++;
                }
            });

        return $closed;
    }
}
