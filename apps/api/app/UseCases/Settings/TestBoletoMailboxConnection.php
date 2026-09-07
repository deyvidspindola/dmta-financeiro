<?php

declare(strict_types=1);

namespace App\UseCases\Settings;

use App\Services\BoletoMailboxClientFactory;
use Throwable;

/**
 * Botão "testar conexão" da caixa de boletos na tela de integrações:
 * conecta no IMAP com o que está salvo e conta os e-mails não lidos.
 * Devolve o resultado pra tela; não lança — a falha (host errado, senha
 * errada, TLS) é a informação que o usuário quer ver.
 *
 * @package App\UseCases\Settings
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   07/09/2026
 *
 * @updated 07/09/2026
 */
final class TestBoletoMailboxConnection
{
    public function __construct(private readonly BoletoMailboxClientFactory $clients) {}

    /**
     * @return array{ok: bool, unseen?: int, error?: string}
     */
    public function execute(): array
    {
        if (blank(config('services.boleto_mailbox.host'))
            || blank(config('services.boleto_mailbox.username'))
            || blank(config('services.boleto_mailbox.password'))) {
            return ['ok' => false, 'error' => 'Preencha e salve host, usuário e senha primeiro.'];
        }

        try {
            $client = $this->clients->make();
            $client->connect();
            $unseen = $client->getFolder('INBOX')->query()->whereUnseen()->get()->count();
            $client->disconnect();
        } catch (Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }

        return ['ok' => true, 'unseen' => $unseen];
    }
}
