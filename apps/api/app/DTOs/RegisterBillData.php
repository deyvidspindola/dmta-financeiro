<?php

declare(strict_types=1);

namespace App\DTOs;

use App\Enums\BillDirection;
use App\Enums\CaptureOrigin;
use App\UseCases\Bill\RegisterBill;

/**
 * Entrada do caso de uso {@see RegisterBill}.
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
final readonly class RegisterBillData
{
    /** @param  int  $installments  1 = boleto avulso; >1 = um boleto por mês, mesmo `installment_group`. */
    public function __construct(
        public int $contextId,
        public string $description,
        public float $amount,
        public string $dueDate,
        public BillDirection $direction,
        public ?int $categoryId = null,
        public ?string $barcode = null,
        public ?string $beneficiary = null,
        public CaptureOrigin $origin = CaptureOrigin::Manual,
        public int $installments = 1,
    ) {}
}
