<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\DTOs\RegisterTransactionData;
use App\Enums\CaptureOrigin;
use App\Enums\StatementEntryType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\IngestNotificationCapturesRequest;
use App\Http\Requests\Api\SaveNotificationCaptureRequest;
use App\Http\Resources\PendingNotificationCaptureResource;
use App\Http\Resources\StatementEntryResource;
use App\Models\PendingNotificationCapture;
use App\UseCases\Notification\IgnoreNotificationCapture;
use App\UseCases\Notification\IngestNotificationCaptures;
use App\UseCases\Notification\SaveNotificationCaptureAsTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Inbox de notificações de banco/carteira lidas pelo app Android
 * (pedido do dono, inspirado no Mobills). Sem contexto até salvar — o
 * usuário escolhe PF/PJ na hora. Ver {@see IngestNotificationCaptures}
 * (dedup na captura) e {@see SaveNotificationCaptureAsTransaction}
 * (trava anti-duplicidade de lançamento).
 *
 * @package App\Http\Controllers\Api\V1
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   03/09/2026
 *
 * @updated 03/09/2026
 */
final class NotificationCaptureController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        return PendingNotificationCaptureResource::collection(
            PendingNotificationCapture::query()
                ->latest('posted_at')
                ->forList($request->string('status', 'pending')->toString())
                ->limit(200)
                ->get(),
        );
    }

    public function ingest(IngestNotificationCapturesRequest $request, IngestNotificationCaptures $useCase): JsonResponse
    {
        return response()->json($useCase->execute($request->items()));
    }

    public function save(
        SaveNotificationCaptureRequest $request,
        PendingNotificationCapture $capture,
        SaveNotificationCaptureAsTransaction $useCase,
    ): StatementEntryResource {
        $entry = $useCase->execute(
            $capture,
            new RegisterTransactionData(
                contextId: $request->integer('context_id'),
                accountId: $request->integer('account_id'),
                description: $request->string('description')->toString(),
                amount: (float) $request->input('amount'),
                type: StatementEntryType::from($request->string('type')->toString()),
                occurredAt: $request->string('occurred_at')->toString(),
                categoryId: $request->integer('category_id') ?: null,
                origin: CaptureOrigin::Notification,
            ),
            $request->boolean('force'),
        );

        return new StatementEntryResource($entry);
    }

    public function ignore(PendingNotificationCapture $capture, IgnoreNotificationCapture $useCase): JsonResponse
    {
        $useCase->execute($capture);

        return response()->json(status: 204);
    }
}
