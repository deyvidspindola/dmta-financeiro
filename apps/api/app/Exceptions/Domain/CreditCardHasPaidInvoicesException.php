<?php

declare(strict_types=1);

namespace App\Exceptions\Domain;

/**
 * Lançada ao excluir um cartão que tem fatura paga — há histórico
 * financeiro real (os pagamentos moveram saldo de conta). O usuário pode
 * confirmar (`force`) para excluir mesmo assim: os lançamentos de
 * pagamento continuam nos extratos, só perdem o vínculo com o cartão.
 *
 * @package App\Exceptions\Domain
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   03/09/2026
 *
 * @updated 03/09/2026
 */
final class CreditCardHasPaidInvoicesException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Este cartão tem fatura paga. Excluir apaga as faturas e compras, mas os pagamentos continuam nos lançamentos da conta. Confirme para excluir mesmo assim.');
    }
}
