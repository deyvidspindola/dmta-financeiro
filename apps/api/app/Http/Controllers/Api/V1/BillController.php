<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\DTOs\RegisterBillData;
use App\Enums\BillDirection;
use App\Http\Controllers\Api\V1\Concerns\AuthorizesContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreBillRequest;
use App\Http\Resources\BillResource;
use App\Models\Context;
use App\UseCases\Bill\RegisterBill;
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
    use AuthorizesContext;

    public function index(Context $context): AnonymousResourceCollection
    {
        $this->assertOwnsContext($context);

        return BillResource::collection($context->bills()->orderBy('due_date')->get());
    }

    public function store(StoreBillRequest $request, Context $context, RegisterBill $useCase): BillResource
    {
        $this->assertOwnsContext($context);

        $bill = $useCase->execute(new RegisterBillData(
            contextId: $context->id,
            description: $request->string('description')->toString(),
            amount: (float) $request->input('amount'),
            dueDate: $request->string('due_date')->toString(),
            direction: BillDirection::from($request->string('direction')->toString()),
            categoryId: $request->integer('category_id') ?: null,
            barcode: $request->input('barcode'),
            beneficiary: $request->input('beneficiary'),
        ));

        return new BillResource($bill);
    }
}
