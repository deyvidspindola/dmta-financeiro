<?php

declare(strict_types=1);

namespace App\Exceptions\Domain;

/**
 * Lançada ao tentar editar um lançamento que é perna de transferência ou
 * está vinculado a um boleto — os dois casos têm efeito colateral em
 * outro registro (a perna par, ou o boleto) que este fluxo simples de
 * edição não sincroniza. Apague e recadastre certo, ou (transferência)
 * cancele e refaça.
 *
 * @package App\Exceptions\Domain
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final class TransactionNotEditableException extends DomainException
{
    public function __construct()
    {
        parent::__construct(
            'Lançamentos de transferência ou vinculados a um boleto não podem ser editados — apague e recadastre.',
        );
    }
}
