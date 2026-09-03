<?php

declare(strict_types=1);

namespace App\UseCases\Bill;

use App\Enums\CaptureStatus;
use App\Exceptions\Domain\CaptureAlreadyProcessedException;
use App\Models\Bill;
use App\Models\PendingBillCapture;
use Illuminate\Support\Facades\Storage;

/**
 * Apaga de vez uma pendência de captura da fila — pro caso do boleto
 * `password_required` cuja senha nunca abre e fica preso ali (pedido do
 * dono). Diferente de {@see RejectBillCapture}, que só marca `rejected`
 * e guarda pra auditoria: aqui some mesmo, incluindo o PDF cifrado em
 * disco.
 *
 * Não apaga captura já `confirmed`: essa virou um {@see Bill}
 * de verdade e o vínculo é histórico.
 *
 * @package App\UseCases\Bill
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   03/09/2026
 *
 * @updated 03/09/2026
 */
final class DeleteBillCapture
{
    /** @throws CaptureAlreadyProcessedException Se a captura já foi confirmada (virou boleto). */
    public function execute(PendingBillCapture $capture): void
    {
        // @phpstan-ignore-next-line identical.alwaysFalse (cast CaptureStatus confirmado em runtime — larastan erra a inferência, ver StatementEntry.php)
        if ($capture->status === CaptureStatus::Confirmed) {
            throw new CaptureAlreadyProcessedException;
        }

        if ($capture->encrypted_pdf_path !== null) {
            Storage::disk('local')->delete($capture->encrypted_pdf_path);
        }

        $capture->delete();
    }
}
