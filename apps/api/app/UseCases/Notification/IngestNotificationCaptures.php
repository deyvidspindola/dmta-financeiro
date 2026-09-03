<?php

declare(strict_types=1);

namespace App\UseCases\Notification;

use App\DTOs\NotificationCaptureItemData;
use App\Enums\NotificationCaptureStatus;
use App\Models\PendingNotificationCapture;
use App\Services\BankNotificationParser;

/**
 * Recebe um lote de notificações lidas pelo app Android e enfileira as
 * inéditas na inbox de revisão. Idempotente: o `fingerprint` (índice
 * único) faz reenvio do mesmo lote não duplicar nada — o app pode
 * mandar de novo sem medo quando a rede falha.
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
final class IngestNotificationCaptures
{
    public function __construct(private readonly BankNotificationParser $parser) {}

    /**
     * @param  list<NotificationCaptureItemData>  $items
     * @return array{ingested: int, duplicates: int}
     */
    public function execute(array $items): array
    {
        if ($items === []) {
            return ['ingested' => 0, 'duplicates' => 0];
        }

        $byFingerprint = [];
        foreach ($items as $item) {
            $byFingerprint[$item->fingerprint()] = $item;
        }

        $known = PendingNotificationCapture::query()
            ->whereIn('fingerprint', array_keys($byFingerprint))
            ->pluck('fingerprint')
            ->all();

        $fresh = array_diff_key($byFingerprint, array_flip($known));

        foreach ($fresh as $fingerprint => $item) {
            $guess = $this->parser->parse($item->title ?? '', $item->body);

            PendingNotificationCapture::query()->create([
                'fingerprint' => $fingerprint,
                'package_name' => $item->packageName,
                'app_label' => $item->appLabel,
                'title' => $item->title,
                'body' => $item->body,
                'posted_at' => $item->postedAt,
                'guessed_type' => $guess['type'],
                'guessed_amount' => $guess['amount'],
                'guessed_date' => $item->postedAt->toDateString(),
                'guessed_description' => $guess['description'],
                'status' => NotificationCaptureStatus::Pending->value,
            ]);
        }

        return ['ingested' => count($fresh), 'duplicates' => count($items) - count($fresh)];
    }
}
