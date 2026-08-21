<?php

declare(strict_types=1);

namespace App\Exceptions\Domain;

/**
 * Lançada ao tentar mover pra outro contexto um lançamento que é perna de
 * transferência ou está vinculado a um boleto — os dois casos exigem que
 * o outro lado (a perna par, ou o boleto) mude de contexto junto, o que
 * este fluxo simples não faz. Apague e recadastre no contexto certo.
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
final class TransactionNotMovableException extends DomainException
{
    public function __construct()
    {
        parent::__construct(
            'Lançamentos de transferência ou vinculados a um boleto não podem ser movidos de contexto.',
        );
    }
}
