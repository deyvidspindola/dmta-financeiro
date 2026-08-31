<?php

declare(strict_types=1);

namespace App\Exceptions\Domain;

/**
 * Lançada ao tentar pagar uma fatura de cartão que já está paga. Pra
 * desfazer um pagamento, apague o lançamento correspondente (isso reabre
 * a fatura).
 *
 * @package App\Exceptions\Domain
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   01/09/2026
 *
 * @updated 01/09/2026
 */
final class CardInvoiceAlreadyPaidException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Esta fatura já foi paga.');
    }
}
