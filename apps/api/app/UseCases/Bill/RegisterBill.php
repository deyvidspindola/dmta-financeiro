<?php

declare(strict_types=1);

namespace App\UseCases\Bill;

use App\Domain\CreditCard\InstallmentPlan;
use App\DTOs\RegisterBillData;
use App\Enums\BillStatus;
use App\Models\Bill;
use App\UseCases\CreditCard\RegisterCardPurchase;
use App\UseCases\Transaction\RegisterTransaction;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * Cadastra um boleto a pagar/receber, sempre como `pending`. Confirmar o
 * pagamento é outro fluxo — {@see RegisterTransaction}
 * com `billId`, que cria o lançamento e marca este boleto como pago.
 *
 * `installments > 1` divide o valor em N boletos, um por mês consecutivo
 * a partir de `dueDate` ({@see InstallmentPlan}, mesmo cálculo de
 * {@see RegisterCardPurchase}), todos com o
 * mesmo `installment_group` — devolve sempre o primeiro. Pagar um não
 * afeta os outros: cada parcela é um `Bill` independente.
 *
 * @package App\UseCases\Bill
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   21/08/2026
 *
 * @updated 22/09/2026
 */
final class RegisterBill
{
    public function __construct(private readonly InstallmentPlan $plan) {}

    public function execute(RegisterBillData $data): Bill
    {
        $count = max(1, $data->installments);
        $amounts = $this->plan->split($data->amount, $count);
        $group = $count > 1 ? (string) Str::uuid() : null;
        $dueDate = Carbon::parse($data->dueDate);

        $first = $this->createInstallment($data, $dueDate, 1, $count, $amounts[0], $group);

        for ($k = 1; $k < $count; $k++) {
            $this->createInstallment($data, $dueDate->copy()->addMonthsNoOverflow($k), $k + 1, $count, $amounts[$k], $group);
        }

        return $first;
    }

    private function createInstallment(
        RegisterBillData $data,
        Carbon $dueDate,
        int $number,
        int $total,
        float $amount,
        ?string $group,
    ): Bill {
        return Bill::create([
            'context_id' => $data->contextId,
            'category_id' => $data->categoryId,
            'description' => $data->description,
            'amount' => $amount,
            'due_date' => $dueDate->toDateString(),
            'direction' => $data->direction->value,
            'status' => BillStatus::Pending->value,
            'origin' => $data->origin->value,
            'barcode' => $number === 1 ? $data->barcode : null,
            'beneficiary' => $data->beneficiary,
            'installment_number' => $total > 1 ? $number : null,
            'installment_total' => $total > 1 ? $total : null,
            'installment_group' => $group,
        ]);
    }
}
