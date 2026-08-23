<?php

declare(strict_types=1);

namespace App\UseCases\Bill;

use App\Domain\Capture\EmailBoletoReaderInterface;
use App\Domain\Capture\PdfDecryption\EncryptedPdfDecryptor;
use App\DTOs\BoletoDraftData;
use App\Enums\CaptureStatus;
use App\Exceptions\Domain\CaptureNotPasswordProtectedException;
use App\Exceptions\Domain\IncorrectBoletoPasswordException;
use App\Models\PendingBillCapture;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Resolve manualmente uma pendência `status: password_required`
 * (DT-07): tenta a senha informada contra o PDF original guardado em
 * `encrypted_pdf_path`, e se abrir, lê o boleto normalmente
 * ({@see EmailBoletoReaderInterface}) e devolve a pendência ao fluxo de
 * revisão de sempre (`status: pending`, com os campos preenchidos). Não
 * salva regra nenhuma sozinho — isso é uma ação separada e explícita do
 * usuário (`POST bill-captures/{capture}/password-rules`).
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
final class UnlockBillCapture
{
    public function __construct(
        private readonly EncryptedPdfDecryptor $decryptor,
        private readonly EmailBoletoReaderInterface $reader,
    ) {}

    /**
     * @throws CaptureNotPasswordProtectedException Se a pendência não estiver `password_required` (ou o arquivo cifrado já não existir).
     * @throws IncorrectBoletoPasswordException Se `$password` não autenticar contra o PDF guardado.
     */
    // @phpstan-ignore-next-line throws.unusedType (larastan não vê o throw de decrypt() como alcançável daqui — mesma inferência errada de CaptureStatus abaixo)
    public function execute(PendingBillCapture $capture, string $password): PendingBillCapture
    {
        // @phpstan-ignore-next-line booleanOr.alwaysTrue, notIdentical.alwaysTrue (cast CaptureStatus confirmado em runtime — larastan erra essa inferência, ver StatementEntry.php)
        if ($capture->status !== CaptureStatus::PasswordRequired || $capture->encrypted_pdf_path === null) {
            throw new CaptureNotPasswordProtectedException;
        }

        // @phpstan-ignore-next-line deadCode.unreachable (só "morto" pela mesma inferência errada de CaptureStatus acima)
        $disk = Storage::disk('local');

        if (! $disk->exists($capture->encrypted_pdf_path)) {
            throw new CaptureNotPasswordProtectedException;
        }

        $decrypted = $this->decrypt($disk->get($capture->encrypted_pdf_path), $password);
        $draft = $this->readDecrypted($decrypted);
        $disk->delete($capture->encrypted_pdf_path);

        $capture->forceFill([
            'linha_digitavel' => $draft->linhaDigitavel,
            'amount' => $draft->amount,
            'due_date' => $draft->dueDate,
            'beneficiary' => $draft->beneficiary,
            'encrypted_pdf_path' => null,
            'status' => CaptureStatus::Pending->value,
        ])->save();

        return $capture;
    }

    /** @throws IncorrectBoletoPasswordException */
    // @phpstan-ignore-next-line method.unused (só "morto" pela mesma inferência errada de CaptureStatus em execute())
    private function decrypt(string $encryptedBytes, string $password): string
    {
        $document = $this->decryptor->inspect($encryptedBytes);
        $decrypted = $document !== null ? $this->decryptor->tryPassword($document, $password) : null;

        if ($decrypted === null) {
            throw new IncorrectBoletoPasswordException;
        }

        return $decrypted;
    }

    // @phpstan-ignore-next-line method.unused (só "morto" pela mesma inferência errada de CaptureStatus em execute())
    private function readDecrypted(string $decryptedBytes): BoletoDraftData
    {
        $tempPath = storage_path('app/private/boleto-mailbox/unlock-'.Str::uuid()->toString().'.pdf');
        File::ensureDirectoryExists(dirname($tempPath));
        File::put($tempPath, $decryptedBytes);

        try {
            return $this->reader->readAttachment($tempPath);
        } finally {
            @unlink($tempPath);
        }
    }
}
