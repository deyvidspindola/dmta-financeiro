<?php

declare(strict_types=1);

namespace App\DTOs;

use App\UseCases\Bill\UpdateBill;
use App\UseCases\Transaction\DeleteTransaction;
use App\UseCases\Transaction\RegisterTransaction;

/**
 * Entrada do caso de uso {@see UpdateBill}. Não
 * inclui `direction`/`status`/`origin` — direção não muda depois de
 * criado, e status só muda via pagamento
 * ({@see RegisterTransaction}) ou exclusão do
 * lançamento vinculado ({@see DeleteTransaction}).
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
final readonly class UpdateBillData
{
    public function __construct(
        public string $description,
        public float $amount,
        public string $dueDate,
        public ?int $categoryId = null,
        public ?string $barcode = null,
        public ?string $beneficiary = null,
    ) {}
}
