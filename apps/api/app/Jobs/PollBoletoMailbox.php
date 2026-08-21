<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Domain\Capture\EmailBoletoReaderInterface;
use App\UseCases\Bill\CaptureBillFromEmail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;
use Webklex\PHPIMAP\ClientManager;
use Webklex\PHPIMAP\Message;

/**
 * Consulta a caixa `boletos@...` a cada execução do `schedule:run`
 * (nunca um processo permanente — ver skill `padroes-laravel-dmta`,
 * seção 2) e transforma cada anexo PDF em pendência de confirmação.
 *
 * Desligado por padrão: se `services.boleto_mailbox.enabled` for falso,
 * o job não tenta conectar em lugar nenhum — mesmo padrão do
 * `NullBankAggregator` (DT-05). Um e-mail com anexo problemático não
 * derruba os outros: erro é logado por mensagem, não por execução
 * inteira.
 *
 * @package App\Jobs
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final class PollBoletoMailbox implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(EmailBoletoReaderInterface $reader, CaptureBillFromEmail $useCase): void
    {
        if (! config('services.boleto_mailbox.enabled')) {
            return;
        }

        $client = (new ClientManager)->make([
            'host' => config('services.boleto_mailbox.host'),
            'port' => config('services.boleto_mailbox.port'),
            'encryption' => config('services.boleto_mailbox.encryption'),
            'validate_cert' => true,
            'protocol' => 'imap',
            'username' => config('services.boleto_mailbox.username'),
            'password' => config('services.boleto_mailbox.password'),
        ]);

        $client->connect();

        $messages = $client->getFolder('INBOX')->query()->whereUnseen()->get();

        foreach ($messages as $message) {
            $this->processMessage($message, $reader, $useCase);
        }
    }

    private function processMessage(Message $message, EmailBoletoReaderInterface $reader, CaptureBillFromEmail $useCase): void
    {
        try {
            $sourceReference = 'email-uid-'.$message->getUid();
            $tempDir = storage_path('app/private/boleto-mailbox');

            foreach ($message->getAttachments() as $index => $attachment) {
                if ($attachment->getMimeType() !== 'application/pdf') {
                    continue;
                }

                $filename = $sourceReference.'-'.$index.'.pdf';
                $attachment->save($tempDir.'/', $filename);
                $pdfPath = $tempDir.'/'.$filename;

                $draft = $reader->readAttachment($pdfPath);
                $useCase->execute($draft, $sourceReference.'-'.$index);

                @unlink($pdfPath);
            }

            $message->setFlag('Seen');
        } catch (Throwable $e) {
            Log::warning('PollBoletoMailbox: falha processando mensagem', [
                'uid' => $message->getUid(),
                'error' => $e->getMessage(),
            ]);
        }
    }
}
