<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\PendingNotificationCapture;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Formato de saída de uma {@see PendingNotificationCapture} para a inbox
 * de notificações do app. Os campos `guessed_*` são só palpite — o app
 * pré-preenche o formulário de salvar com eles.
 *
 * @mixin PendingNotificationCapture
 *
 * @package App\Http\Resources
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   03/09/2026
 *
 * @updated 03/09/2026
 */
final class PendingNotificationCaptureResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'package_name' => $this->package_name,
            'app_label' => $this->app_label,
            'title' => $this->title,
            'body' => $this->body,
            // @phpstan-ignore-next-line method.nonObject (cast 'datetime' da migration)
            'posted_at' => $this->posted_at?->toIso8601String(),
            'guessed_type' => $this->guessed_type,
            'guessed_amount' => $this->guessed_amount !== null ? (float) $this->guessed_amount : null,
            // @phpstan-ignore-next-line method.nonObject (cast 'date' da migration)
            'guessed_date' => $this->guessed_date?->toDateString(),
            'guessed_description' => $this->guessed_description,
            // @phpstan-ignore-next-line property.nonObject (cast NotificationCaptureStatus da migration)
            'status' => $this->status->value,
            'statement_entry_id' => $this->statement_entry_id,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
