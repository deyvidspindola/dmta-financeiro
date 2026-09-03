<?php

declare(strict_types=1);

namespace App\Exceptions\Domain;

/**
 * Lançada ao salvar uma notificação capturada como lançamento quando já
 * existe um lançamento igual (mesma conta, tipo, valor e data) — a trava
 * anti-duplicidade pedida pelo dono. O app oferece "salvar mesmo assim"
 * (`force`) pra quando o gasto repetido é real.
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
final class DuplicateTransactionException extends DomainException
{
    public function __construct()
    {
        parent::__construct('Já existe um lançamento igual a esse (mesma conta, valor e data). Salve mesmo assim se não for repetido.');
    }
}
