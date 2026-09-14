<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Enums\BillDirection;
use App\Enums\BillStatus;
use App\Models\Bill;
use App\Services\TelegramBotClient;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Lembrete de boleto vencendo amanhã, mandado pelo mesmo bot do Telegram
 * que já recebe lançamento rápido ({@see TelegramBotClient}) — sem canal
 * novo, só mais um gatilho no client que já existe. D-11 (uso pessoal):
 * um único `chat_id` configurado (`services.telegram.allowed_chat_id`),
 * sem tabela de destinatário por usuário.
 *
 * Roda 1x/dia (`routes/console.php`). Cada boleto só bate a condição
 * "due_date = amanhã" numa única execução do dia — a própria janela de
 * data evita lembrete duplicado, sem precisar marcar "já avisado" em
 * lugar nenhum. Não lembra o que já venceu (isso é o card "Boletos em
 * atraso" do painel, lembrete é só o aviso "amanhã vence").
 *
 * @package App\Jobs
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   14/09/2026
 *
 * @updated 14/09/2026
 */
final class SendBillReminders implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function handle(TelegramBotClient $telegram): void
    {
        $chatId = config('services.telegram.allowed_chat_id');

        if (! $chatId) {
            return;
        }

        $bills = Bill::query()
            ->where('status', BillStatus::Pending->value)
            ->whereDate('due_date', Carbon::tomorrow())
            ->with('context:id,name')
            ->orderBy('due_date')
            ->get();

        if ($bills->isEmpty()) {
            return;
        }

        $telegram->sendMessage((string) $chatId, $this->buildMessage($bills));
    }

    /** @param  Collection<int, Bill>  $bills */
    private function buildMessage(Collection $bills): string
    {
        $count = $bills->count();
        $header = $count === 1
            ? '🔔 1 boleto vence amanhã:'
            : "🔔 {$count} boletos vencem amanhã:";

        $lines = $bills->map(function (Bill $bill): string {
            $amount = number_format((float) $bill->amount, 2, ',', '.');
            $verb = $bill->direction === BillDirection::Payable->value ? 'Pagar' : 'Receber';
            $context = $bill->context?->name;

            return "• {$verb} R$ {$amount} — {$bill->description}".($context ? " ({$context})" : '');
        });

        return $header."\n".$lines->implode("\n");
    }
}
