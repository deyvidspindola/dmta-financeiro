<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\DTOs\PayBillData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\PayBillRequest;
use App\Http\Resources\StatementEntryResource;
use App\Models\Bill;
use App\Models\Context;
use App\UseCases\Bill\PayBill;

/**
 * Pagamento rápido de boleto num clique — pedido em produção pra não
 * repetir descrição/valor/categoria que o boleto já tem. É uma ação
 * customizada (`bills/{bill}/pay`), não CRUD de um recurso, então fica
 * fora do {@see BillController} por decisão de desenho, não por limite
 * de linhas (ver DT-08).
 *
 * @package App\Http\Controllers\Api\V1
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   22/08/2026
 *
 * @updated 22/08/2026
 */
final class PayBillController extends Controller
{
    public function store(PayBillRequest $request, Context $context, Bill $bill, PayBill $useCase): StatementEntryResource
    {
        $entry = $useCase->execute($bill, new PayBillData(
            accountId: $request->integer('account_id'),
            occurredAt: $request->input('occurred_at'),
        ));

        return new StatementEntryResource($entry);
    }
}
