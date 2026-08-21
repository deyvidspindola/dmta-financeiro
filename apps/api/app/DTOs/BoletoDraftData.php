<?php

declare(strict_types=1);

namespace App\DTOs;

use App\Domain\Capture\EmailBoletoReaderInterface;

/**
 * O que um {@see EmailBoletoReaderInterface} extrai
 * de um PDF — sempre um rascunho, nunca confirmado sozinho. Qualquer
 * campo pode vir `null` quando a extração falhou parcialmente; quem
 * revisa (tela de pendências) decide se completa à mão ou rejeita.
 *
 * @package App\DTOs
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final readonly class BoletoDraftData
{
    public function __construct(
        public ?string $linhaDigitavel,
        public ?float $amount,
        public ?string $dueDate,
        public ?string $beneficiary = null,
    ) {}
}
