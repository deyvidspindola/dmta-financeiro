<?php

declare(strict_types=1);

namespace App\UseCases\Notification;

use App\Enums\NotificationCaptureStatus;
use App\Exceptions\Domain\CaptureAlreadyProcessedException;
use App\Models\PendingNotificationCapture;

/**
 * Descarta uma notificação capturada (não era gasto/receita, era ruído,
 * já foi lançada na mão). Não apaga — mantém pra não recapturar a mesma
 * notificação no próximo lote (o `fingerprint` continua ali).
 *
 * @package App\UseCases\Notification
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   03/09/2026
 *
 * @updated 03/09/2026
 */
final class IgnoreNotificationCapture
{
    /** @throws CaptureAlreadyProcessedException Se a captura já não estiver `pending`. */
    public function execute(PendingNotificationCapture $capture): void
    {
        // @phpstan-ignore-next-line notIdentical.alwaysTrue (larastan erra a inferência de casts(), ver StatementEntry.php)
        if ($capture->status !== NotificationCaptureStatus::Pending) {
            throw new CaptureAlreadyProcessedException;
        }

        // @phpstan-ignore-next-line deadCode.unreachable (só "morto" pela inferência errada de casts() acima)
        $capture->forceFill(['status' => NotificationCaptureStatus::Ignored->value])->save();
    }
}
