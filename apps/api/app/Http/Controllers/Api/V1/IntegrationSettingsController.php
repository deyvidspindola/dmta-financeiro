<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\UpdateIntegrationSettingsRequest;
use App\Http\Resources\IntegrationSettingsResource;
use App\Models\IntegrationSettings;
use App\Models\TelegramWebhookEvent;
use App\UseCases\Settings\GetTelegramWebhookInfo;
use App\UseCases\Settings\RegisterTelegramWebhook;
use App\UseCases\Settings\TestBoletoMailboxConnection;
use App\UseCases\Settings\TestTelegramConnection;
use App\UseCases\Settings\UpdateIntegrationSettings;
use Illuminate\Http\JsonResponse;

/**
 * Configuração das integrações da F1 (bot do Telegram e caixa IMAP de
 * boletos) por tela — antes só dava por `.env` / secret do deploy.
 * Recurso global, sem contexto PF/PJ. Segredo nunca sai em claro (ver
 * {@see IntegrationSettingsResource}).
 *
 * @package App\Http\Controllers\Api\V1
 *
 * @author  Deyvid Spindola <spindoladeyvid@gmail.com>
 *
 * @version 1.0.0
 *
 * @since   07/09/2026
 *
 * @updated 07/09/2026
 */
final class IntegrationSettingsController extends Controller
{
    public function show(): IntegrationSettingsResource
    {
        return new IntegrationSettingsResource(IntegrationSettings::current());
    }

    public function update(
        UpdateIntegrationSettingsRequest $request,
        UpdateIntegrationSettings $useCase,
    ): IntegrationSettingsResource {
        return new IntegrationSettingsResource($useCase->execute($request->validated()));
    }

    public function testTelegram(TestTelegramConnection $useCase): JsonResponse
    {
        return response()->json($useCase->execute());
    }

    public function registerTelegramWebhook(RegisterTelegramWebhook $useCase): JsonResponse
    {
        return response()->json($useCase->execute());
    }

    public function telegramWebhookInfo(GetTelegramWebhookInfo $useCase): JsonResponse
    {
        return response()->json($useCase->execute());
    }

    /** Últimas mensagens que o webhook recebeu e o que foi feito com cada uma. */
    public function telegramEvents(): JsonResponse
    {
        return response()->json([
            'data' => TelegramWebhookEvent::query()
                ->latest('id')
                ->limit(40)
                ->get(['id', 'chat_id', 'message_text', 'outcome', 'detail', 'reply_sent', 'created_at']),
        ]);
    }

    public function testBoletoMailbox(TestBoletoMailboxConnection $useCase): JsonResponse
    {
        return response()->json($useCase->execute());
    }
}
