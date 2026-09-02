<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\DTOs\RegisterTransactionData;
use App\DTOs\UpdateTransactionData;
use App\Enums\StatementEntryType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\IndexTransactionRequest;
use App\Http\Requests\Api\StoreTransactionRequest;
use App\Http\Requests\Api\UpdateTransactionRequest;
use App\Http\Resources\StatementEntryResource;
use App\Models\Context;
use App\Models\StatementEntry;
use App\UseCases\Transaction\DeleteTransaction;
use App\UseCases\Transaction\RegisterTransaction;
use App\UseCases\Transaction\SettleTransaction;
use App\UseCases\Transaction\UpdateTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Lançamentos manuais numa conta (F0), o mesmo endpoint que a F1 reusa
 * para e-mail/Telegram trocando só `origin`. Cobre o CRUD do recurso:
 * listar, ver, criar, editar e apagar.
 *
 * NÃO mora aqui: transferência entre contas ({@see TransferController},
 * recurso distinto com duas pernas), mover lançamento de contexto
 * ({@see MoveTransactionController}, ação customizada com resolução de
 * contexto do usuário) e toda regra de saldo/meta/boleto, que fica nos
 * casos de uso em `app/UseCases/Transaction/`.
 *
 * @package App\Http\Controllers\Api\V1
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 2.0.0
 *
 * @since   21/08/2026
 *
 * @updated 31/08/2026
 */
final class TransactionController extends Controller
{
    /** Extrato do contexto, do mais recente ao mais antigo, com os filtros opcionais de {@see IndexTransactionRequest}. */
    public function index(IndexTransactionRequest $request, Context $context): AnonymousResourceCollection
    {
        $entries = $context->statementEntries()
            ->with('transferPair.account.context')
            ->applyFilters($request->filters())
            ->latest('occurred_at')
            ->get();

        return StatementEntryResource::collection($entries);
    }

    /** `transferPair` eager-load é pro "de onde → pra onde" — ver StatementEntryResource::transferDetails(). */
    public function show(Context $context, StatementEntry $transaction): StatementEntryResource
    {
        $transaction->loadMissing('transferPair.account.context');

        return new StatementEntryResource($transaction);
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
            settled: $request->boolean('settled', true),
        ));

        return new StatementEntryResource($entry);
    }

    /** Efetiva um lançamento previsto — move o saldo agora. Ver {@see SettleTransaction}. */
    public function settle(Context $context, StatementEntry $transaction, SettleTransaction $useCase): StatementEntryResource
    {
        return new StatementEntryResource($useCase->execute($transaction));
    }

    public function update(
        UpdateTransactionRequest $request,
        Context $context,
        StatementEntry $transaction,
        UpdateTransaction $useCase,
    ): StatementEntryResource {
        $entry = $useCase->execute($transaction, new UpdateTransactionData(
            accountId: $request->integer('account_id'),
            description: $request->string('description')->toString(),
            amount: (float) $request->input('amount'),
            type: StatementEntryType::from($request->string('type')->toString()),
            occurredAt: $request->string('occurred_at')->toString(),
            categoryId: $request->integer('category_id') ?: null,
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
