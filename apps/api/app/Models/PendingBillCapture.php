<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\CaptureOrigin;
use App\Enums\CaptureStatus;
use Database\Factories\PendingBillCaptureFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['origin', 'source_reference', 'sender_email', 'linha_digitavel', 'amount', 'due_date', 'beneficiary', 'encrypted_pdf_path', 'status', 'bill_id'])]
/**
 * Boleto capturado por canal automático, aguardando revisão humana —
 * ver docblock da migration `create_pending_bill_captures_table` pra
 * entender por que não tem `context_id`. Pode ficar temporariamente em
 * `status: password_required` quando o PDF veio protegido por senha e
 * nenhuma candidata abriu (DT-07) — `sender_email` e
 * `encrypted_pdf_path` só importam nesse caso.
 *
 * @property-read CaptureOrigin $origin
 * @property-read CaptureStatus $status
 *
 * @package App\Models
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   21/08/2026
 *
 * @updated 23/08/2026
 */
class PendingBillCapture extends Model
{
    /** @use HasFactory<PendingBillCaptureFactory> */
    use HasFactory;

    /** @return BelongsTo<Bill, $this> */
    public function bill(): BelongsTo
    {
        return $this->belongsTo(Bill::class);
    }

    /**
     * Filtro da tela de captura. `pending` inclui boletos que ainda
     * precisam de senha — senão a fila de revisão some com eles.
     *
     * @param  Builder<PendingBillCapture>  $query
     * @return Builder<PendingBillCapture>
     */
    public function scopeForList(Builder $query, string $status): Builder
    {
        if ($status === 'pending') {
            return $query->whereIn('status', ['pending', 'password_required']);
        }

        if ($status !== 'all') {
            return $query->where('status', $status);
        }

        return $query;
    }

    /**
     * Converte atributos para tipos de domínio.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'amount' => 'decimal:2',
            'origin' => CaptureOrigin::class,
            'status' => CaptureStatus::class,
        ];
    }
}
