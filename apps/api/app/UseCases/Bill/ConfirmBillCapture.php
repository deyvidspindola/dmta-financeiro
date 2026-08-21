<?php

declare(strict_types=1);

namespace App\UseCases\Bill;

use App\DTOs\RegisterBillData;
use App\Enums\CaptureStatus;
use App\Exceptions\Domain\CaptureAlreadyProcessedException;
use App\Models\Bill;
use App\Models\PendingBillCapture;
use Illuminate\Support\Facades\DB;

/**
 * Promove uma pendência de captura a um {@see Bill} de verdade — o
 * momento em que "dado capturado automaticamente" vira "dado confiável"
 * (capítulo 2.5 do documento de concepção). Reusa {@see RegisterBill}
 * pra não duplicar a lógica de criação de boleto; só acrescenta o
 * vínculo com a pendência de origem.
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
final class ConfirmBillCapture
{
    public function __construct(
        // @phpstan-ignore-next-line property.onlyWritten (usada dentro do closure abaixo — larastan marca como morto por causa da mesma inferência errada de CaptureStatus)
        private readonly RegisterBill $registerBill,
    ) {}

    /** @throws CaptureAlreadyProcessedException Se a pendência já não estiver `pending`. */
    public function execute(PendingBillCapture $capture, RegisterBillData $data): Bill
    {
        // @phpstan-ignore-next-line identical.alwaysFalse (cast CaptureStatus confirmado em runtime — larastan erra essa inferência, ver StatementEntry.php)
        if ($capture->status !== CaptureStatus::Pending) {
            throw new CaptureAlreadyProcessedException;
        }

        // @phpstan-ignore-next-line deadCode.unreachable (só "morto" pela mesma inferência errada de CaptureStatus acima)
        return DB::transaction(function () use ($capture, $data): Bill {
            $bill = $this->registerBill->execute($data);

            $capture->forceFill([
                'status' => CaptureStatus::Confirmed->value,
                'bill_id' => $bill->id,
            ])->save();

            return $bill;
        });
    }
}
