<?php

declare(strict_types=1);

namespace App\UseCases\Bill;

use App\DTOs\PayBillData;
use App\DTOs\RegisterTransactionData;
use App\Enums\BillDirection;
use App\Enums\StatementEntryType;
use App\Models\Bill;
use App\Models\StatementEntry;
use App\UseCases\Transaction\RegisterTransaction;
use Illuminate\Support\Carbon;

/**
 * Confirma o pagamento/recebimento de um boleto num clique — pedido em
 * produção pra não obrigar preencher de novo descrição/valor/categoria
 * que o boleto já tem. Só monta os dados e delega pra
 * {@see RegisterTransaction}, que já sabe marcar o `Bill` como pago
 * quando `billId` vem preenchido — nenhuma regra nova aqui.
 *
 * @package App\UseCases\Bill
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   22/08/2026
 *
 * @updated 22/08/2026
 */
final class PayBill
{
    public function __construct(private readonly RegisterTransaction $registerTransaction) {}

    public function execute(Bill $bill, PayBillData $data): StatementEntry
    {
        $type = $bill->direction === BillDirection::Payable->value
            ? StatementEntryType::Expense
            : StatementEntryType::Income;

        return $this->registerTransaction->execute(new RegisterTransactionData(
            contextId: $bill->context_id,
            accountId: $data->accountId,
            description: $bill->description,
            amount: (float) $bill->amount,
            type: $type,
            occurredAt: $data->occurredAt ?? Carbon::today()->toDateString(),
            categoryId: $bill->category_id,
            billId: $bill->id,
        ));
    }
}
