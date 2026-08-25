<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\DTOs\RegisterTransactionData;
use App\Enums\StatementEntryType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreTransactionRequest;
use App\Http\Resources\StatementEntryResource;
use App\Models\Context;
use App\Models\StatementEntry;
use App\UseCases\Transaction\DeleteTransaction;
use App\UseCases\Transaction\RegisterTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Lançamentos manuais numa conta (F0) — o mesmo endpoint que F1 vai
 * reaproveitar para e-mail/Telegram, só trocando `origin`. Visualizar é
 * {@see ShowTransactionController}, editar é {@see UpdateTransactionController},
 * mover pra outro contexto é {@see MoveTransactionController},
 * transferência entre contas é {@see TransferController} — cada um tem
 * regra própria demais pra caber aqui sem estourar o limite de linhas.
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
final class TransactionController extends Controller
{
    public function index(Context $context): AnonymousResourceCollection
    {
        $entries = $context->statementEntries()
            ->with('transferPair.account.context')
            ->latest('occurred_at')
            ->get();

        return StatementEntryResource::collection($entries);
    }

    public function store(
        StoreTransactionRequest $request,
        Context $context,
        RegisterTransaction $useCase,
    ): StatementEntryResource {
        $entry = $useCase->execute(new RegisterTransactionData(
            contextId: $context->id,
            accountId: $request->integer('account_id'),
            description: $request->string('description')->toString(),
            amount: (float) $request->input('amount'),
            type: StatementEntryType::from($request->string('type')->toString()),
            occurredAt: $request->string('occurred_at')->toString(),
            categoryId: $request->integer('category_id') ?: null,
            billId: $request->integer('bill_id') ?: null,
            goalId: $request->integer('goal_id') ?: null,
        ));

        return new StatementEntryResource($entry);
    }

    /** Apaga o lançamento e desfaz o efeito no saldo/boleto — ver {@see DeleteTransaction}. */
    public function destroy(Context $context, StatementEntry $transaction, DeleteTransaction $useCase): JsonResponse
    {
        $useCase->execute($transaction);

        return response()->json(status: 204);
    }
}
