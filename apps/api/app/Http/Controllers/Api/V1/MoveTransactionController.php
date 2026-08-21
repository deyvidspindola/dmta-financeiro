<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\DTOs\MoveTransactionToContextData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\MoveTransactionRequest;
use App\Http\Resources\StatementEntryResource;
use App\Models\Context;
use App\Models\StatementEntry;
use App\UseCases\Transaction\MoveTransactionToContext;

/**
 * Move um lançamento cadastrado no contexto errado (PF ⇄ empresa) pro
 * contexto certo — ver {@see MoveTransactionToContext}.
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
final class MoveTransactionController extends Controller
{
    public function store(
        MoveTransactionRequest $request,
        Context $context,
        StatementEntry $transaction,
        MoveTransactionToContext $useCase,
    ): StatementEntryResource {
        // `target_context_id` só pode ser um contexto do próprio usuário —
        // checado aqui via relação, nunca confiando no ID cru do request
        // (senão daria pra "mover" lançamento pra dentro da conta de
        // outra pessoa só adivinhando o ID do context/account dela).
        $targetContext = $request->user()->contexts()->findOrFail($request->integer('target_context_id'));

        $entry = $useCase->execute($transaction, new MoveTransactionToContextData(
            targetContextId: $targetContext->id,
            targetAccountId: $request->integer('target_account_id'),
            targetCategoryId: $request->integer('target_category_id') ?: null,
        ));

        return new StatementEntryResource($entry);
    }
}
