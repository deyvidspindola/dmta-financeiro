<?php

declare(strict_types=1);

namespace App\Exceptions\Domain;

/**
 * Lançada quando a fatura de cartão enviada é um PDF protegido e nenhuma
 * senha cadastrada (nem a informada na hora) abriu o arquivo. O preview
 * trata isso como "peça a senha ao usuário" (devolve `needs_password`,
 * não erro); o import trata como 422.
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
final class CardInvoicePdfPasswordRequiredException extends DomainException
{
    public function __construct(public readonly bool $unsupported = false)
    {
        parent::__construct(
            $unsupported
                ? 'A fatura veio num PDF protegido com um formato que não sabemos abrir. Exporte a fatura em CSV ou remova a senha antes de enviar.'
                : 'A fatura veio protegida por senha e nenhuma senha cadastrada abriu. Informe a senha do PDF.',
        );
    }
}
