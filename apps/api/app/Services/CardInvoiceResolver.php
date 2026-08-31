<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\CardInvoiceStatus;
use App\Models\CardInvoice;
use App\Models\CreditCard;
use App\UseCases\CreditCard\RegisterCardPurchase;
use Illuminate\Support\Carbon;

/**
 * Resolve a fatura `open` de um cartão para um mês de referência,
 * criando-a se ainda não existe. Reusado pelo lançamento de compra
 * ({@see RegisterCardPurchase}) e, adiante, pela
 * materialização de compromissos recorrentes no cartão.
 *
 * Sem estado, sem transação própria — só chame de dentro de um caso de
 * uso que já abriu uma transação de banco (o `lockForUpdate` depende
 * disso).
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   01/09/2026
 *
 * @updated 01/09/2026
 */
final class CardInvoiceResolver
{
    /**
     * @param  Carbon  $referenceMonth  Dia 1 do mês da fatura.
     * @param  Carbon  $dueDate  Vencimento a usar se a fatura for criada agora.
     */
    public function forMonth(CreditCard $card, Carbon $referenceMonth, Carbon $dueDate): CardInvoice
    {
        // whereDate: reference_month é `date`, comparar string crua não
        // bate com o valor materializado pelo cast.
        return CardInvoice::query()
            ->where('credit_card_id', $card->id)
            ->whereDate('reference_month', $referenceMonth->toDateString())
            ->lockForUpdate()
            ->first()
            ?? CardInvoice::create([
                'credit_card_id' => $card->id,
                'reference_month' => $referenceMonth->toDateString(),
                'status' => CardInvoiceStatus::Open->value,
                'due_date' => $dueDate->toDateString(),
                'total_amount' => 0,
            ]);
    }
}
