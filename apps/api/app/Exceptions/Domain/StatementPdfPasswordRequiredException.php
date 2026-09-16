<?php

declare(strict_types=1);

namespace App\Exceptions\Domain;

/**
 * Lançada quando o extrato bancário enviado é um PDF protegido e nenhuma
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
 * @since   16/09/2026
 *
 * @updated 16/09/2026
 */
final class StatementPdfPasswordRequiredException extends DomainException
{
    public function __construct(public readonly bool $unsupported = false)
    {
        parent::__construct(
            $unsupported
                ? 'O extrato veio num PDF protegido com um formato que não sabemos abrir. Exporte o extrato em CSV ou remova a senha antes de enviar.'
                : 'O extrato veio protegido por senha e nenhuma senha cadastrada abriu. Informe a senha do PDF.',
        );
    }
}
