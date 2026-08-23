<?php

declare(strict_types=1);

namespace App\Exceptions\Domain;

/**
 * Lançada quando a conexão IMAP com a caixa de boletos falha (host/porta
 * errados, usuário/senha inválidos, etc.) — traduz uma exceção do
 * `webklex/php-imap` (que viraria 500) em erro de domínio (422) com a
 * mensagem original, pro botão "capturar agora" mostrar algo acionável
 * em vez de um erro genérico de servidor.
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
final class BoletoMailboxConnectionException extends DomainException
{
    public function __construct(string $reason)
    {
        parent::__construct("Não foi possível conectar na caixa de boletos: {$reason}");
    }
}
