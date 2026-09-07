<?php

declare(strict_types=1);

namespace App\Services;

use App\Domain\Capture\EmailBoletoReaderInterface;
use App\Exceptions\Domain\BoletoMailboxConnectionException;
use App\UseCases\Bill\CaptureBillFromEmail;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Throwable;
use Webklex\PHPIMAP\Address;
use Webklex\PHPIMAP\Attachment;
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
 * Antes de entregar o PDF ao `$reader`, verifica se ele está protegido
 * por senha e tenta abrir com {@see BoletoPdfUnlocker} (DT-07) — só cai
 * pra `password_required` se nenhuma candidata abrir.
 *
 * @package App\Services
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   23/08/2026
 *
 * @updated 25/08/2026
 */
final class BoletoMailboxPoller
{
    public function __construct(
        private readonly EmailBoletoReaderInterface $reader,
        private readonly CaptureBillFromEmail $useCase,
        private readonly BoletoPdfUnlocker $unlocker,
        private readonly BoletoMailboxClientFactory $clients,
    ) {}

    /**
     * @return array{processed: int, captured: int} E-mails não lidos vistos, e quantos viraram pendência nova.
     *
     * @throws BoletoMailboxConnectionException Se a conexão IMAP falhar (host/porta/credencial).
     */
    public function poll(): array
    {
        $client = $this->clients->make();

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

    /**
     * @return int Quantidade de pendências novas criadas a partir desta mensagem.
     *
     * Cada anexo tem seu próprio try/catch — um PDF problemático (criptografado
     * de um jeito que nem o `ignoreEncryption` resolve, corrompido, etc.) fica
     * só logado, não impede os outros anexos nem a marcação de lida no fim.
     * Bug real visto em produção antes desta versão: uma falha em qualquer
     * ponto do processamento pulava `setFlag('Seen')` inteiro, e o mesmo
     * e-mail voltava a ser reprocessado (e falhar) a cada ciclo pra sempre.
     */
    private function processMessage(Message $message): int
    {
        $sourceReference = 'email-uid-'.$message->getUid();
        $senderEmail = $this->senderEmail($message);
        $tempDir = storage_path('app/private/boleto-mailbox');

        try {
            // Nada cria esta pasta antes do primeiro anexo chegar — não é
            // coberta por storage:link nem por nenhuma migration.
            File::ensureDirectoryExists($tempDir);
            $attachments = $message->getAttachments();
        } catch (Throwable $e) {
            Log::warning('BoletoMailboxPoller: falha lendo mensagem', [
                'uid' => $message->getUid(),
                'error' => $e->getMessage(),
            ]);

            return 0;
        }

        $captured = 0;

        foreach ($attachments as $index => $attachment) {
            if ($attachment->getMimeType() !== 'application/pdf') {
                continue;
            }

            $captured += $this->processAttachment($attachment, $sourceReference, (int) $index, $tempDir, $message->getUid(), $senderEmail);
        }

        try {
            $message->setFlag('Seen');
        } catch (Throwable $e) {
            Log::warning('BoletoMailboxPoller: falha marcando mensagem como lida', [
                'uid' => $message->getUid(),
                'error' => $e->getMessage(),
            ]);
        }

        return $captured;
    }

    /** @return int 1 se virou pendência nova (lida ou `password_required`), 0 se este anexo falhou (logado, não trava os outros). */
    private function processAttachment(Attachment $attachment, string $sourceReference, int $index, string $tempDir, mixed $uid, ?string $senderEmail): int
    {
        $filename = $sourceReference.'-'.$index.'.pdf';
        $pdfPath = $tempDir.'/'.$filename;
        $captureReference = $sourceReference.'-'.$index;
        $readablePath = null;

        try {
            $attachment->save($tempDir.'/', $filename);
            $readablePath = $this->unlocker->resolveToPath($pdfPath, $captureReference, $senderEmail);

            if ($readablePath === null) {
                return 1;
            }

            $draft = $this->reader->readAttachment($readablePath);

            if ($draft->linhaDigitavel === null && $this->unlocker->lockUnreadableEncrypted(
                File::get($pdfPath),
                $captureReference,
                $senderEmail,
            )) {
                return 1;
            }

            $this->useCase->execute($draft, $captureReference, $senderEmail);

            return 1;
        } catch (Throwable $e) {
            Log::warning('BoletoMailboxPoller: falha processando anexo', [
                'uid' => $uid,
                'attachment' => $index,
                'error' => $e->getMessage(),
            ]);

            return 0;
        } finally {
            @unlink($pdfPath);

            if ($readablePath !== null && $readablePath !== $pdfPath) {
                @unlink($readablePath);
            }
        }
    }

    private function senderEmail(Message $message): ?string
    {
        $from = $message->getFrom()->first();

        return $from instanceof Address && $from->mail !== '' ? $from->mail : null;
    }
}
