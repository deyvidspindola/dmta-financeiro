<?php

declare(strict_types=1);

namespace App\UseCases\Bill;

use App\Enums\CaptureStatus;
use App\Exceptions\Domain\CaptureAlreadyProcessedException;
use App\Models\PendingBillCapture;

/**
 * Descarta uma pendência de captura (não era um boleto de verdade, veio
 * errado, duplicado...). Não apaga o registro — mantém pra auditoria de
 * "o que o motor de captura tentou processar".
 *
 * @package App\UseCases\Bill
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final class RejectBillCapture
{
    /** @throws CaptureAlreadyProcessedException Se a pendência já não estiver `pending`. */
    public function execute(PendingBillCapture $capture): void
    {
        // @phpstan-ignore-next-line identical.alwaysFalse (cast CaptureStatus confirmado em runtime — larastan erra essa inferência, ver StatementEntry.php)
        if ($capture->status !== CaptureStatus::Pending) {
            throw new CaptureAlreadyProcessedException;
        }

        // @phpstan-ignore-next-line deadCode.unreachable (só "morto" pela mesma inferência errada de CaptureStatus acima)
        $capture->forceFill(['status' => CaptureStatus::Rejected->value])->save();
    }
}
