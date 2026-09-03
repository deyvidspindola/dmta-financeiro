<?php

declare(strict_types=1);

namespace App\UseCases\User;

use App\Models\BoletoPasswordRule;
use App\Models\PendingBillCapture;
use App\Models\PendingNotificationCapture;
use Illuminate\Support\Facades\Storage;

/**
 * Limpa as filas de captura e as regras de senha de boleto — dados que
 * NÃO são escopados por `context_id` e por isso escapavam do
 * {@see ResetUserData}. Como o sistema é de um usuário só, "começar do
 * zero" tem que zerar isso também (pedido do dono).
 *
 * Apaga os PDFs cifrados em disco antes de sumir com as linhas — senão
 * ficariam órfãos em `storage/app/private`.
 *
 * Não toca em `Bill`/`StatementEntry` já criados a partir de capturas
 * confirmadas: quem cuida deles é o cascade de `contexts` no reset.
 *
 * @package App\UseCases\User
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   03/09/2026
 *
 * @updated 03/09/2026
 */
final class PurgeCaptureData
{
    public function execute(): void
    {
        $disk = Storage::disk('local');

        PendingBillCapture::query()
            ->whereNotNull('encrypted_pdf_path')
            ->pluck('encrypted_pdf_path')
            ->each(function (string $path) use ($disk): void {
                $disk->delete($path);
            });

        PendingBillCapture::query()->delete();
        PendingNotificationCapture::query()->delete();
        BoletoPasswordRule::query()->delete();
    }
}
