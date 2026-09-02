<?php

declare(strict_types=1);

namespace App\Exceptions\Domain;

/**
 * Lançada ao tentar editar uma compra de cartão que é parcelada
 * (`installment_group`) ou que está numa fatura já paga — os dois casos
 * mexem em registros que este fluxo simples não sincroniza (as outras
 * parcelas, ou o pagamento da fatura). Apague e recadastre.
 *
 * @package App\Exceptions\Domain
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   02/09/2026
 */
final class CardPurchaseNotEditableException extends DomainException
{
    public function __construct()
    {
        parent::__construct(
            'Compra parcelada ou em fatura já paga não pode ser editada — apague e recadastre.',
        );
    }
}
