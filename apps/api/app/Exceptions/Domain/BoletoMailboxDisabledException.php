<?php

declare(strict_types=1);

namespace App\Exceptions\Domain;

/**
 * Lançada quando alguém tenta disparar a captura de boleto por e-mail
 * (botão "capturar agora") sem `BOLETO_MAILBOX_ENABLED`/credenciais
 * configuradas — mesmo espírito do `NullBankAggregator` previsto pra F2
 * (DT-05, `docs/03_INTERFACES_PLUGAVEIS.md`): erro claro, não silêncio
 * confuso, quando algo tenta usar um canal desligado por padrão.
 *
 * @package App\Exceptions\Domain
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   23/08/2026
 *
 * @updated 23/08/2026
 */
final class BoletoMailboxDisabledException extends DomainException
{
    public function __construct()
    {
        parent::__construct(
            'Captura de boleto por e-mail ainda não está configurada — preencha BOLETO_MAILBOX_* no .env e ligue BOLETO_MAILBOX_ENABLED.',
        );
    }
}
