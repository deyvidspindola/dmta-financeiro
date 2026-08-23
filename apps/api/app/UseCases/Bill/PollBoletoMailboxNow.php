<?php

declare(strict_types=1);

namespace App\UseCases\Bill;

use App\Exceptions\Domain\BoletoMailboxDisabledException;
use App\Jobs\PollBoletoMailbox;
use App\Services\BoletoMailboxPoller;

/**
 * Captura boletos da caixa de e-mail agora, sem esperar o próximo ciclo
 * do agendador (a cada 5 minutos) — botão "capturar agora" na tela de
 * Capturas. Mesma lógica do job agendado ({@see PollBoletoMailbox}),
 * só que síncrona e com resultado imediato pra tela, e reage diferente
 * a canal desligado: o job ignora em silêncio, aqui isso é um erro
 * visível — quem clicou o botão precisa saber que não configurou ainda.
 *
 * @package App\UseCases\Bill
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   23/08/2026
 *
 * @updated 23/08/2026
 */
final class PollBoletoMailboxNow
{
    public function __construct(private readonly BoletoMailboxPoller $poller) {}

    /**
     * @return array{processed: int, captured: int}
     *
     * @throws BoletoMailboxDisabledException Se BOLETO_MAILBOX_ENABLED não estiver ligado.
     */
    public function execute(): array
    {
        if (! config('services.boleto_mailbox.enabled')) {
            throw new BoletoMailboxDisabledException;
        }

        return $this->poller->poll();
    }
}
