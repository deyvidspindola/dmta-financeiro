<?php

declare(strict_types=1);

namespace App\UseCases\Bill;

use App\DTOs\RegisterBillData;
use App\Enums\BillStatus;
use App\Models\Bill;
use App\UseCases\Transaction\RegisterTransaction;

/**
 * Cadastra um boleto a pagar/receber, sempre como `pending`. Confirmar o
 * pagamento é outro fluxo — {@see RegisterTransaction}
 * com `billId`, que cria o lançamento e marca este boleto como pago.
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
final class RegisterBill
{
    public function execute(RegisterBillData $data): Bill
    {
        return Bill::create([
            'context_id' => $data->contextId,
            'category_id' => $data->categoryId,
            'description' => $data->description,
            'amount' => $data->amount,
            'due_date' => $data->dueDate,
            'direction' => $data->direction->value,
            'status' => BillStatus::Pending->value,
            'origin' => $data->origin->value,
            'barcode' => $data->barcode,
            'beneficiary' => $data->beneficiary,
        ]);
    }
}
