<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Services\BoletoMailboxPoller;
use App\UseCases\Bill\PollBoletoMailboxNow;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Dispara {@see BoletoMailboxPoller} a cada execução do `schedule:run`
 * (nunca um processo permanente — ver skill `padroes-laravel-dmta`,
 * seção 2). Desligado por padrão: se `services.boleto_mailbox.enabled`
 * for falso, nem tenta conectar — mesmo padrão do `NullBankAggregator`
 * (DT-05). A mesma lógica de conexão/captura também roda sob demanda
 * pelo botão "capturar agora" ({@see PollBoletoMailboxNow}).
 *
 * @package App\Jobs
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   21/08/2026
 *
 * @updated 23/08/2026
 */
final class PollBoletoMailbox implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function handle(BoletoMailboxPoller $poller): void
    {
        if (! config('services.boleto_mailbox.enabled')) {
            return;
        }

        $poller->poll();
    }
}
