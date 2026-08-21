<?php

declare(strict_types=1);

namespace App\UseCases\Bill;

use App\DTOs\UpdateBillData;
use App\Models\Bill;

/**
 * Atualiza dados de um boleto (descrição, valor, vencimento, categoria,
 * código de barras, beneficiário). Não muda direção nem status — ver
 * docblock de {@see UpdateBillData}.
 *
 * @package App\UseCases\Bill
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final class UpdateBill
{
    public function execute(Bill $bill, UpdateBillData $data): Bill
    {
        $bill->update([
            'description' => $data->description,
            'amount' => $data->amount,
            'due_date' => $data->dueDate,
            'category_id' => $data->categoryId,
            'barcode' => $data->barcode,
            'beneficiary' => $data->beneficiary,
        ]);

        return $bill;
    }
}
