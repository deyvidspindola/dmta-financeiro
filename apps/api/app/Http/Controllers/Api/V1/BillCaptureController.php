<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\DTOs\RegisterBillData;
use App\Enums\BillDirection;
use App\Enums\CaptureOrigin;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ConfirmBillCaptureRequest;
use App\Http\Requests\Api\UnlockBillCaptureRequest;
use App\Http\Resources\BillResource;
use App\Http\Resources\PendingBillCaptureResource;
use App\Models\Context;
use App\Models\PendingBillCapture;
use App\UseCases\Bill\ConfirmBillCapture;
use App\UseCases\Bill\RejectBillCapture;
use App\UseCases\Bill\UnlockBillCapture;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Fila de boletos capturados por e-mail aguardando confirmação (F1,
 * D-06) — não é aninhada em `/contexts/{context}` porque a captura
 * ainda não tem contexto (ver docblock de
 * `create_pending_bill_captures_table`). `confirm` é onde o contexto
 * finalmente é escolhido e a checagem de posse acontece. `unlock`
 * resolve uma pendência `password_required` com a senha informada na
 * tela (DT-07).
 *
 * @package App\Http\Controllers\Api\V1
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.1.0
 *
 * @since   21/08/2026
 *
 * @updated 23/08/2026
 */
final class BillCaptureController extends Controller
{
    /** `?status=pending|confirmed|rejected|all` — default `pending` (o que a tela de revisão precisa ver). */
    public function index(Request $request): AnonymousResourceCollection
    {
        $status = $request->string('status', 'pending')->toString();
        $query = PendingBillCapture::query()->latest();

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        return PendingBillCaptureResource::collection($query->get());
    }

    public function confirm(ConfirmBillCaptureRequest $request, PendingBillCapture $capture, ConfirmBillCapture $useCase): BillResource
    {
        $context = Context::query()->findOrFail($request->integer('context_id'));
        $this->authorize('view', $context);

        $bill = $useCase->execute($capture, new RegisterBillData(
            contextId: $context->id,
            description: $request->string('description')->toString(),
            amount: (float) $request->input('amount'),
            dueDate: $request->string('due_date')->toString(),
            direction: BillDirection::from($request->string('direction')->toString()),
            categoryId: $request->integer('category_id') ?: null,
            barcode: $capture->linha_digitavel,
            beneficiary: $request->input('beneficiary'),
            origin: CaptureOrigin::Email,
        ));

        return new BillResource($bill);
    }

    public function reject(PendingBillCapture $capture, RejectBillCapture $useCase): JsonResponse
    {
        $useCase->execute($capture);

        return response()->json(status: 204);
    }

    /** Tenta a senha informada contra o PDF original de uma pendência `password_required` — se abrir, volta a `pending` com os campos preenchidos, pronta pra `confirm` normal. */
    public function unlock(UnlockBillCaptureRequest $request, PendingBillCapture $capture, UnlockBillCapture $useCase): PendingBillCaptureResource
    {
        $unlocked = $useCase->execute($capture, $request->string('password')->toString());

        return new PendingBillCaptureResource($unlocked);
    }
}
