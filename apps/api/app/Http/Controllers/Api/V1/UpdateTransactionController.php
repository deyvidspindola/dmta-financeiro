<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\DTOs\UpdateTransactionData;
use App\Enums\StatementEntryType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\UpdateTransactionRequest;
use App\Http\Resources\StatementEntryResource;
use App\Models\Context;
use App\Models\StatementEntry;
use App\UseCases\Transaction\UpdateTransaction;

/**
 * Edição de lançamento — separado de {@see TransactionController} só pra
 * não estourar o limite de linhas do controller (CONVENTIONS.md).
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
final class UpdateTransactionController extends Controller
{
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
        ));

        return new StatementEntryResource($entry);
    }
}
