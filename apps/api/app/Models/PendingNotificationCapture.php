<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\NotificationCaptureStatus;
use Database\Factories\PendingNotificationCaptureFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'fingerprint', 'package_name', 'app_label', 'title', 'body', 'posted_at',
    'guessed_type', 'guessed_amount', 'guessed_date', 'guessed_description',
    'status', 'statement_entry_id',
])]
/**
 * Notificação de app de banco/carteira capturada pelo app Android,
 * aguardando o usuário decidir se vira lançamento — ver o docblock da
 * migration `create_pending_notification_captures_table`. Sem
 * `context_id`: o contexto é escolhido no momento de salvar.
 *
 * @property-read NotificationCaptureStatus $status
 *
 * @package App\Models
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   03/09/2026
 *
 * @updated 03/09/2026
 */
class PendingNotificationCapture extends Model
{
    /** @use HasFactory<PendingNotificationCaptureFactory> */
    use HasFactory;

    /** @return BelongsTo<StatementEntry, $this> */
    public function statementEntry(): BelongsTo
    {
        return $this->belongsTo(StatementEntry::class);
    }

    /**
     * Filtro da tela de inbox. `all` = tudo; senão filtra pelo status.
     *
     * @param  Builder<PendingNotificationCapture>  $query
     * @return Builder<PendingNotificationCapture>
     */
    public function scopeForList(Builder $query, string $status): Builder
    {
        if ($status !== 'all') {
            return $query->where('status', $status);
        }

        return $query;
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'posted_at' => 'datetime',
            'guessed_date' => 'date',
            'guessed_amount' => 'decimal:2',
            'status' => NotificationCaptureStatus::class,
        ];
    }
}
