<?php

declare(strict_types=1);

namespace App\DTOs;

use App\UseCases\Simulation\SimulateInstallmentPurchase;

/**
 * Entrada do caso de uso {@see SimulateInstallmentPurchase}. `amount` é
 * a soma de todas as parcelas (o "valor total" da tela, capítulo 9) —
 * não o valor à vista. `cashPrice`, quando informado, habilita custo
 * total e CET (capítulo 9.4); sem ele, o simulador ainda responde
 * comprometimento e "quando cabe", só sem os dois.
 *
 * @package App\DTOs
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   25/08/2026
 *
 * @updated 25/08/2026
 */
final readonly class SimulateInstallmentPurchaseData
{
    public function __construct(
        public float $amount,
        public int $installments,
        public ?float $cashPrice = null,
    ) {}
}
