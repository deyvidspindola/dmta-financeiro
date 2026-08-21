<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\CaptureOrigin;
use App\Enums\CaptureStatus;
use Database\Factories\PendingBillCaptureFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['origin', 'source_reference', 'linha_digitavel', 'amount', 'due_date', 'beneficiary', 'status', 'bill_id'])]
/**
 * Boleto capturado por canal automático, aguardando revisão humana —
 * ver docblock da migration `create_pending_bill_captures_table` pra
 * entender por que não tem `context_id`.
 *
 * @property-read CaptureOrigin $origin
 * @property-read CaptureStatus $status
 *
 * @package App\Models
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
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
