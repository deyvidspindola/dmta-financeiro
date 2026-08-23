<?php

declare(strict_types=1);

namespace App\Services;

use App\Domain\Capture\EmailBoletoReaderInterface;
use App\Exceptions\Domain\BoletoMailboxConnectionException;
use App\UseCases\Bill\CaptureBillFromEmail;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Throwable;
use Webklex\PHPIMAP\ClientManager;
use Webklex\PHPIMAP\Message;

/**
 * Conecta na caixa `boletos@...` (IMAP), lista e-mails não lidos e
 * transforma cada anexo PDF em pendência de confirmação. Reusado pelo
 * job agendado (`schedule:run`, a cada 5 minutos) e pelo botão
 * "capturar agora" da tela de Capturas — mesma lógica, dois gatilhos,
 * pra não duplicar (regra de zero duplicação da skill
 * `padroes-laravel-dmta`).
 *
 * Não decide se o canal está habilitado — quem chama (Job ou UseCase)
 * checa `services.boleto_mailbox.enabled` antes, cada um com a reação
 * apropriada ao próprio contexto (Job ignora em silêncio; UseCase do
 * botão lança exceção pro usuário ver).
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   23/08/2026
 *
 * @updated 23/08/2026
 */
final class BoletoMailboxPoller
{
    public function __construct(
        private readonly EmailBoletoReaderInterface $reader,
        private readonly CaptureBillFromEmail $useCase,
    ) {}

    /**
     * @return array{processed: int, captured: int} E-mails não lidos vistos, e quantos viraram pendência nova.
     *
     * @throws BoletoMailboxConnectionException Se a conexão IMAP falhar (host/porta/credencial).
     */
    public function poll(): array
    {
        $client = (new ClientManager)->make([
            'host' => config('services.boleto_mailbox.host'),
            'port' => config('services.boleto_mailbox.port'),
            'encryption' => config('services.boleto_mailbox.encryption'),
            'validate_cert' => true,
            'protocol' => 'imap',
            'username' => config('services.boleto_mailbox.username'),
            'password' => config('services.boleto_mailbox.password'),
        ]);

        try {
            $client->connect();
        } catch (Throwable $e) {
            throw new BoletoMailboxConnectionException($e->getMessage());
        }

        $messages = $client->getFolder('INBOX')->query()->whereUnseen()->get();
        $processed = 0;
        $captured = 0;

        foreach ($messages as $message) {
            $processed++;
            $captured += $this->processMessage($message);
        }

        return ['processed' => $processed, 'captured' => $captured];
    }

    /** @return int Quantidade de pendências novas criadas a partir desta mensagem. */
    private function processMessage(Message $message): int
    {
        $captured = 0;

        try {
            $sourceReference = 'email-uid-'.$message->getUid();
            $tempDir = storage_path('app/private/boleto-mailbox');
            // Nada cria esta pasta antes do primeiro anexo chegar — não é
            // coberta por storage:link nem por nenhuma migration. Bug real
            // visto em produção: sem isso, todo anexo falha com "Failed to
            // open stream" e a mensagem nunca é marcada como lida, gerando
            // reprocessamento infinito do mesmo e-mail a cada ciclo.
            File::ensureDirectoryExists($tempDir);

            foreach ($message->getAttachments() as $index => $attachment) {
                if ($attachment->getMimeType() !== 'application/pdf') {
                    continue;
                }

                $filename = $sourceReference.'-'.$index.'.pdf';
                $attachment->save($tempDir.'/', $filename);
                $pdfPath = $tempDir.'/'.$filename;

                $draft = $this->reader->readAttachment($pdfPath);
                $this->useCase->execute($draft, $sourceReference.'-'.$index);
                $captured++;

                @unlink($pdfPath);
            }

            $message->setFlag('Seen');
        } catch (Throwable $e) {
            Log::warning('BoletoMailboxPoller: falha processando mensagem', [
                'uid' => $message->getUid(),
                'error' => $e->getMessage(),
            ]);
        }

        return $captured;
    }
}
