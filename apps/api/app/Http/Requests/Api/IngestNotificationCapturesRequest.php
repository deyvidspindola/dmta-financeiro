<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use App\DTOs\NotificationCaptureItemData;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validação de `POST /api/v1/notification-captures` — lote de
 * notificações lidas pelo app Android. Aceita `posted_at` em ISO-8601 ou
 * em milissegundos desde a época (o que o listener nativo entrega).
 *
 * @package App\Http\Requests\Api
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   03/09/2026
 *
 * @updated 03/09/2026
 */
final class IngestNotificationCapturesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1', 'max:200'],
            'items.*.package_name' => ['required', 'string', 'max:191'],
            'items.*.app_label' => ['nullable', 'string', 'max:191'],
            'items.*.title' => ['nullable', 'string', 'max:191'],
            'items.*.body' => ['required', 'string', 'max:2000'],
            'items.*.posted_at' => ['required'],
        ];
    }

    /** @return list<NotificationCaptureItemData> */
    public function items(): array
    {
        /** @var list<array<string, mixed>> $raw */
        $raw = $this->array('items');

        return array_map(fn (array $item): NotificationCaptureItemData => new NotificationCaptureItemData(
            packageName: (string) $item['package_name'],
            appLabel: isset($item['app_label']) ? (string) $item['app_label'] : null,
            title: isset($item['title']) ? (string) $item['title'] : null,
            body: (string) $item['body'],
            postedAt: $this->parsePostedAt($item['posted_at']),
        ), $raw);
    }

    private function parsePostedAt(mixed $value): CarbonImmutable
    {
        if (is_numeric($value)) {
            $ms = (int) $value;

            return CarbonImmutable::createFromTimestampMs($ms > 0 ? $ms : now()->getTimestampMs());
        }

        try {
            return CarbonImmutable::parse((string) $value);
        } catch (\Throwable) {
            return CarbonImmutable::now();
        }
    }
}
