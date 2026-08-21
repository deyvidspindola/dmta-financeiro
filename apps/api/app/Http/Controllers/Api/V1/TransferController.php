<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\DTOs\TransferBetweenAccountsData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreTransferRequest;
use App\Http\Resources\TransferResource;
use App\Models\Context;
use App\UseCases\Transaction\TransferBetweenAccounts;

/**
 * Transferência entre duas contas — do próprio `{context}` da URL (mesmo
 * comportamento de sempre) ou pra outro contexto do usuário
 * (`to_context_id`), incluindo PF ⇄ empresa. Ver
 * {@see TransferBetweenAccounts}.
 *
 * @package App\Http\Controllers\Api\V1
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   21/08/2026
 *
 * @updated 21/08/2026
 */
final class TransferController extends Controller
{
    public function store(StoreTransferRequest $request, Context $context, TransferBetweenAccounts $useCase): TransferResource
    {
        // `to_context_id` só pode ser um contexto do próprio usuário —
        // checado aqui via relação, nunca confiando no ID cru do request
        // (mesma razão do MoveTransactionController). Omitido, cai no
        // próprio {context} da URL — já autorizado pelo `can:view,context`
        // da rota.
        $toContext = $request->filled('to_context_id')
            ? $request->user()->contexts()->findOrFail($request->integer('to_context_id'))
            : $context;

        $result = $useCase->execute(new TransferBetweenAccountsData(
            fromContextId: $context->id,
            toContextId: $toContext->id,
            fromAccountId: $request->integer('from_account_id'),
            toAccountId: $request->integer('to_account_id'),
            amount: (float) $request->input('amount'),
            description: $request->string('description')->toString(),
            occurredAt: $request->string('occurred_at')->toString(),
        ));

        return new TransferResource($result);
    }
}
