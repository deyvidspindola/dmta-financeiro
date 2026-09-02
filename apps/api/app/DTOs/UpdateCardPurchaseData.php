<?php

declare(strict_types=1);

namespace App\DTOs;

use App\UseCases\CreditCard\UpdateCardPurchase;

/**
 * Entrada do caso de uso {@see UpdateCardPurchase}. Não edita
 * parcelamento — `installments` não entra aqui.
 *
 * @package App\DTOs
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   02/09/2026
 */
final readonly class UpdateCardPurchaseData
{
    public function __construct(
        public string $description,
        public float $amount,
        public string $occurredAt,
        public ?int $categoryId = null,
    ) {}
}
