<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\DTOs\RegisterDebtData;
use App\DTOs\SettleDebtData;
use App\DTOs\UpdateDebtData;
use App\Enums\DebtDirection;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\SettleDebtRequest;
use App\Http\Requests\Api\StoreDebtRequest;
use App\Http\Requests\Api\UpdateDebtRequest;
use App\Http\Resources\DebtResource;
use App\Models\Context;
use App\Models\Debt;
use App\UseCases\Debt\RegisterDebt;
use App\UseCases\Debt\SettleDebt;
use App\UseCases\Debt\UpdateDebt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Dívidas pendentes (D-15): registro de ciência de compromisso — nunca
 * um lançamento no balanço mensal (ver docblock de {@see Debt}).
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
final class DebtController extends Controller
{
    public function index(Context $context): AnonymousResourceCollection
    {
        return DebtResource::collection($context->debts()->orderBy('due_date')->get());
    }

    public function store(StoreDebtRequest $request, Context $context, RegisterDebt $useCase): DebtResource
    {
        return new DebtResource($useCase->execute(new RegisterDebtData(
            contextId: $context->id,
            description: $request->string('description')->toString(),
            amount: (float) $request->input('amount'),
            direction: DebtDirection::from($request->string('direction')->toString()),
            counterparty: $request->input('counterparty'),
            dueDate: $request->input('due_date'),
            notes: $request->input('notes'),
        )));
    }

    public function update(UpdateDebtRequest $request, Context $context, Debt $debt, UpdateDebt $useCase): DebtResource
    {
        return new DebtResource($useCase->execute($debt, new UpdateDebtData(
            description: $request->string('description')->toString(),
            amount: (float) $request->input('amount'),
            counterparty: $request->input('counterparty'),
            dueDate: $request->input('due_date'),
            notes: $request->input('notes'),
        )));
    }

    /** Marca como quitada; com `account_id`, também gera o lançamento — ver {@see SettleDebt}. */
    public function settle(SettleDebtRequest $request, Context $context, Debt $debt, SettleDebt $useCase): DebtResource
    {
        return new DebtResource($useCase->execute($debt, new SettleDebtData(
            accountId: $request->integer('account_id') ?: null,
            occurredAt: $request->input('occurred_at'),
        )));
    }

    public function destroy(Context $context, Debt $debt): JsonResponse
    {
        $debt->delete();

        return response()->json(status: 204);
    }
}
