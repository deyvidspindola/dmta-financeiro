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
 * Transferência entre duas contas do mesmo contexto — ver
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
        $result = $useCase->execute(new TransferBetweenAccountsData(
            contextId: $context->id,
            fromAccountId: $request->integer('from_account_id'),
            toAccountId: $request->integer('to_account_id'),
            amount: (float) $request->input('amount'),
            description: $request->string('description')->toString(),
            occurredAt: $request->string('occurred_at')->toString(),
        ));

        return new TransferResource($result);
    }
}
