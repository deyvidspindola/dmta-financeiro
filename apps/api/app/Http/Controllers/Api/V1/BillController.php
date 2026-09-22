<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\DTOs\RegisterBillData;
use App\DTOs\UpdateBillData;
use App\Enums\BillDirection;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\IndexBillRequest;
use App\Http\Requests\Api\StoreBillRequest;
use App\Http\Requests\Api\UpdateBillRequest;
use App\Http\Resources\BillResource;
use App\Models\Bill;
use App\Models\Context;
use App\UseCases\Bill\RegisterBill;
use App\UseCases\Bill\UpdateBill;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Boletos a pagar/receber de cadastro manual (D-06, F0).
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
final class BillController extends Controller
{
    /** Boletos do contexto por vencimento, com os filtros opcionais de {@see IndexBillRequest}. */
    public function index(IndexBillRequest $request, Context $context): AnonymousResourceCollection
    {
        return BillResource::collection(
            $context->bills()->applyFilters($request->filters())->orderBy('due_date')->get(),
        );
    }

    public function store(StoreBillRequest $request, Context $context, RegisterBill $useCase): BillResource
    {
        $bill = $useCase->execute(new RegisterBillData(
            contextId: $context->id,
            description: $request->string('description')->toString(),
            amount: (float) $request->input('amount'),
            dueDate: $request->string('due_date')->toString(),
            direction: BillDirection::from($request->string('direction')->toString()),
            categoryId: $request->integer('category_id') ?: null,
            barcode: $request->input('barcode'),
            beneficiary: $request->input('beneficiary'),
            installments: $request->integer('installments') ?: 1,
        ));

        return new BillResource($bill);
    }

    public function update(UpdateBillRequest $request, Context $context, Bill $bill, UpdateBill $useCase): BillResource
    {
        $updated = $useCase->execute($bill, new UpdateBillData(
            description: $request->string('description')->toString(),
            amount: (float) $request->input('amount'),
            dueDate: $request->string('due_date')->toString(),
            categoryId: $request->integer('category_id') ?: null,
            barcode: $request->input('barcode'),
            beneficiary: $request->input('beneficiary'),
        ));

        return new BillResource($updated);
    }

    /** Apaga o boleto — não desfaz lançamento já vinculado, só desvincula (ver migration). */
    public function destroy(Context $context, Bill $bill): JsonResponse
    {
        $bill->delete();

        return response()->json(status: 204);
    }
}
