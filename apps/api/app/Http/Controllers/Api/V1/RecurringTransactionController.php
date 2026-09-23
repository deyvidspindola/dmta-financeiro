<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\DTOs\RegisterRecurringTransactionData;
use App\Enums\RecurrenceInterval;
use App\Enums\StatementEntryType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreRecurringTransactionRequest;
use App\Http\Resources\RecurringTransactionResource;
use App\Models\Context;
use App\Models\RecurringTransaction;
use App\UseCases\Transaction\CancelRecurringTransaction;
use App\UseCases\Transaction\RegisterRecurringTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Regras de lançamento recorrente/despesa fixa — ver
 * {@see RegisterRecurringTransaction} e o job
 * `GenerateRecurringTransactionEntries`, que materializa as ocorrências.
 *
 * @package App\Http\Controllers\Api\V1
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   21/08/2026
 *
 * @updated 23/09/2026
 */
final class RecurringTransactionController extends Controller
{
    public function index(Context $context): AnonymousResourceCollection
    {
        $rules = $context->recurringTransactions()->where('active', true)->get();

        return RecurringTransactionResource::collection($rules);
    }

    public function store(
        StoreRecurringTransactionRequest $request,
        Context $context,
        RegisterRecurringTransaction $useCase,
    ): RecurringTransactionResource {
        $rule = $useCase->execute(new RegisterRecurringTransactionData(
            contextId: $context->id,
            accountId: $request->integer('account_id') ?: null,
            description: $request->string('description')->toString(),
            amount: (float) $request->input('amount'),
            type: StatementEntryType::from($request->string('type')->toString()),
            interval: RecurrenceInterval::from($request->string('interval')->toString()),
            startDate: $request->string('start_date')->toString(),
            endDate: $request->filled('end_date') ? $request->string('end_date')->toString() : null,
            categoryId: $request->integer('category_id') ?: null,
            creditCardId: $request->integer('credit_card_id') ?: null,
        ));

        return new RecurringTransactionResource($rule);
    }

    /** Cancela a regra — não apaga ocorrências já geradas, ver {@see CancelRecurringTransaction}. */
    public function destroy(
        Context $context,
        RecurringTransaction $recurringTransaction,
        CancelRecurringTransaction $useCase,
    ): JsonResponse {
        $useCase->execute($recurringTransaction);

        return response()->json(status: 204);
    }
}
