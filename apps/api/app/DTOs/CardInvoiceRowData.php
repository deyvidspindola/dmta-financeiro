<?php

declare(strict_types=1);

namespace App\DTOs;

use App\Services\CardInvoiceImportRowParser;
use App\UseCases\CreditCard\RegisterImportedCardInvoiceRow;

/**
 * Uma linha da fatura importada (CSV/PDF), já normalizada pelo
 * {@see CardInvoiceImportRowParser}. Diferente de compra digitada: aqui
 * o `amount` é o valor **de uma parcela** e `firstInstallment` diz qual
 * parcela essa linha representa na fatura — o {@see RegisterImportedCardInvoiceRow}
 * projeta da `firstInstallment` até a `installmentTotal` nas faturas
 * seguintes.
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
final readonly class CardInvoiceRowData
{
    public function __construct(
        public int $contextId,
        public int $creditCardId,
        public string $description,
        public float $amount,
        public string $occurredAt,
        public ?int $categoryId,
        public int $firstInstallment = 1,
        public int $installmentTotal = 1,
    ) {}

    public function isInstallment(): bool
    {
        return $this->installmentTotal > 1;
    }

    /** Quantas parcelas essa linha manda criar (da atual até a última). */
    public function installmentSpan(): int
    {
        return $this->installmentTotal - $this->firstInstallment + 1;
    }
}
