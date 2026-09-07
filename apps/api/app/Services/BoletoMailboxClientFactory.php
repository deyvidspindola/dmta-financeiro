<?php

declare(strict_types=1);

namespace App\Services;

use Webklex\PHPIMAP\Client;
use Webklex\PHPIMAP\ClientManager;

/**
 * Monta o cliente IMAP da caixa `boletos@...` a partir de
 * `config('services.boleto_mailbox.*')` — um lugar só pra essa
 * configuração, usado tanto pelo poller de verdade
 * ({@see BoletoMailboxPoller}) quanto pelo "testar conexão" da tela de
 * integrações. Não conecta: só constrói.
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   07/09/2026
 *
 * @updated 07/09/2026
 */
final class BoletoMailboxClientFactory
{
    public function make(): Client
    {
        return (new ClientManager)->make([
            'host' => config('services.boleto_mailbox.host'),
            'port' => config('services.boleto_mailbox.port'),
            'encryption' => config('services.boleto_mailbox.encryption'),
            'validate_cert' => true,
            'protocol' => 'imap',
            'username' => config('services.boleto_mailbox.username'),
            'password' => config('services.boleto_mailbox.password'),
        ]);
    }
}
