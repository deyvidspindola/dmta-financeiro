<?php

declare(strict_types=1);

namespace App\DTOs;

use App\UseCases\Notification\IngestNotificationCaptures;
use Carbon\CarbonImmutable;

/**
 * Uma notificação crua enviada pelo app Android para
 * {@see IngestNotificationCaptures}.
 *
 * @package App\DTOs
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   03/09/2026
 *
 * @updated 03/09/2026
 */
final readonly class NotificationCaptureItemData
{
    public function __construct(
        public string $packageName,
        public ?string $appLabel,
        public ?string $title,
        public string $body,
        public CarbonImmutable $postedAt,
    ) {}

    /** Impressão digital estável — dedup na captura (pacote + texto + minuto). */
    public function fingerprint(): string
    {
        return sha1($this->packageName.'|'.$this->body.'|'.intdiv($this->postedAt->getTimestamp(), 60));
    }
}
