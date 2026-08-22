<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\DTOs\RegisterRecurringBillData;
use App\Enums\BillDirection;
use App\Enums\RecurrenceInterval;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreRecurringBillRequest;
use App\Http\Resources\RecurringBillResource;
use App\Models\Bill;
use App\Models\Context;
use App\Models\RecurringBill;
use App\UseCases\Bill\CancelRecurringBill;
use App\UseCases\Bill\RegisterRecurringBill;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Regras de obrigação recorrente (DARF/DAS e afins, capítulo 07) — ver
 * {@see RegisterRecurringBill} e o job `GenerateRecurringBillEntries`,
 * que materializa as ocorrências como {@see Bill}.
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
final class RecurringBillController extends Controller
{
    public function index(Context $context): AnonymousResourceCollection
    {
        $rules = $context->recurringBills()->where('active', true)->get();

        return RecurringBillResource::collection($rules);
    }

    public function store(
        StoreRecurringBillRequest $request,
        Context $context,
        RegisterRecurringBill $useCase,
    ): RecurringBillResource {
        $rule = $useCase->execute(new RegisterRecurringBillData(
            contextId: $context->id,
            description: $request->string('description')->toString(),
            amount: (float) $request->input('amount'),
            direction: BillDirection::from($request->string('direction')->toString()),
            interval: RecurrenceInterval::from($request->string('interval')->toString()),
            startDate: $request->string('start_date')->toString(),
            endDate: $request->filled('end_date') ? $request->string('end_date')->toString() : null,
            categoryId: $request->integer('category_id') ?: null,
            reminderDaysBefore: $request->filled('reminder_days_before') ? $request->integer('reminder_days_before') : 5,
        ));

        return new RecurringBillResource($rule);
    }

    /** Cancela a regra — não apaga boletos já gerados, ver {@see CancelRecurringBill}. */
    public function destroy(
        Context $context,
        RecurringBill $recurringBill,
        CancelRecurringBill $useCase,
    ): JsonResponse {
        $useCase->execute($recurringBill);

        return response()->json(status: 204);
    }
}
