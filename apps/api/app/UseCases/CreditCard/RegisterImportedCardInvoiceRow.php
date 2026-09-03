<?php

declare(strict_types=1);

namespace App\UseCases\CreditCard;

use App\Domain\CreditCard\InvoiceAllocator;
use App\DTOs\CardInvoiceRowData;
use App\Models\CreditCard;
use App\Services\CardInvoiceInstallmentPlacer;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Grava uma linha de fatura importada. À vista: uma compra na fatura da
 * data. Parcelada ("N/M"): a parcela N e as seguintes N+1..M nas faturas
 * dos meses seguintes — é isso que faz a compra parcelada aparecer nos
 * meses futuros do cartão. A colocação/deduplicação por parcela fica no
 * {@see CardInvoiceInstallmentPlacer}.
 *
 * @package App\UseCases\CreditCard
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   03/09/2026
 *
 * @updated 03/09/2026
 */
final class RegisterImportedCardInvoiceRow
{
    public function __construct(
        private readonly InvoiceAllocator $allocator,
        private readonly CardInvoiceInstallmentPlacer $placer,
    ) {}

    /** @return array{created: int, skipped: int} */
    public function execute(CardInvoiceRowData $row, bool $force = false): array
    {
        return DB::transaction(function () use ($row, $force): array {
            /** @var CreditCard $card */
            $card = CreditCard::query()->whereKey($row->creditCardId)->lockForUpdate()->firstOrFail();

            $window = $this->allocator->allocate(
                Carbon::parse($row->occurredAt),
                (int) $card->closing_day,
                (int) $card->due_day,
            );

            return $this->placer->place($row, $card, $window, $force);
        });
    }
}
